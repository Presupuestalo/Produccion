export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MARKETPLACE_TABLES_SQL = `
-- Crear todas las tablas necesarias para el sistema de marketplace de leads

-- 1. Tabla de créditos de empresa
CREATE TABLE IF NOT EXISTS company_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  credits_purchased_total INTEGER NOT NULL DEFAULT 0,
  credits_spent_total INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 2. Tabla de transacciones de créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spent', 'refund')),
  amount INTEGER NOT NULL,
  payment_amount DECIMAL(10,2),
  description TEXT,
  lead_request_id UUID,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de configuración de preferencias de empresa
CREATE TABLE IF NOT EXISTS company_lead_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_radius_km INTEGER NOT NULL DEFAULT 30,
  accepted_reform_types TEXT[] DEFAULT ARRAY['reforma_integral', 'cocina', 'bano']::TEXT[],
  min_budget DECIMAL(10,2) DEFAULT 0,
  max_budget DECIMAL(10,2) DEFAULT 999999,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 4. Tabla de solicitudes de leads (publicadas por propietarios)
CREATE TABLE IF NOT EXISTS lead_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired', 'cancelled')),
  estimated_budget DECIMAL(10,2) NOT NULL,
  credits_cost INTEGER NOT NULL,
  reform_types TEXT[] NOT NULL,
  project_description TEXT,
  surface_m2 DECIMAL(10,2),
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'ES',
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  max_companies INTEGER NOT NULL DEFAULT 4,
  companies_accessed_count INTEGER NOT NULL DEFAULT 0,
  companies_accessed_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ
);

-- 5. Tabla de interacciones con leads
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_request_id UUID NOT NULL REFERENCES lead_requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'accessed', 'contacted', 'claim_no_response', 'won', 'lost')),
  credits_spent INTEGER,
  credits_refunded INTEGER,
  notes TEXT,
  viewed_at TIMESTAMPTZ,
  accessed_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  claim_submitted_at TIMESTAMPTZ,
  claim_resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_request_id, company_id)
);

-- 6. índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_company_credits_company_id ON company_credits(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_company_id ON credit_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_lead_request ON credit_transactions(lead_request_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_status ON lead_requests(status);
CREATE INDEX IF NOT EXISTS idx_lead_requests_homeowner ON lead_requests(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_location ON lead_requests(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead ON lead_interactions(lead_request_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_company ON lead_interactions(company_id);

-- 7. Función para calcular coste en créditos según presupuesto
CREATE OR REPLACE FUNCTION calculate_lead_credits_cost(budget DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  IF budget < 5000 THEN
    RETURN 8;
  ELSIF budget < 15000 THEN
    RETURN 15;
  ELSIF budget < 30000 THEN
    RETURN 25;
  ELSIF budget < 50000 THEN
    RETURN 35;
  ELSE
    RETURN 50;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Añadir columna para rastrear proyectos importados desde leads
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_from_lead_id UUID;
`;

export async function POST() {
  console.log("[v0] Starting marketplace setup...")
  
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.email)

    console.log("[v0] Executing marketplace setup SQL...")

    const { error } = await supabase.rpc("exec_sql", { sql_query: MARKETPLACE_TABLES_SQL })

    if (error) {
      console.error("[v0] Error ejecutando script:", error)
      return NextResponse.json(
        { error: "Failed to run sql query", details: error.message },
        { status: 500 }
      )
    }

    console.log("[v0] Marketplace tables created successfully")

    return NextResponse.json({
      success: true,
      message: "Tablas del marketplace creadas exitosamente",
    })
  } catch (error: any) {
    console.error("[v0] Error general en setup:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

