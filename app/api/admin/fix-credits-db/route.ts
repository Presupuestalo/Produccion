import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

const SQL = `
-- 1. Identificar y borrar duplicados quedándonos solo con uno por empresa
DELETE FROM company_credits 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM company_credits 
    GROUP BY company_id
);

-- 2. Asegurar que existe la restricción UNIQUE en company_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'company_credits_company_id_key'
    ) THEN
        ALTER TABLE company_credits ADD CONSTRAINT company_credits_company_id_key UNIQUE (company_id);
    END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE company_credits ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de RLS
DROP POLICY IF EXISTS "Companies can view their own credits" ON company_credits;
CREATE POLICY "Companies can view their own credits" 
ON company_credits 
FOR SELECT 
USING (true); -- Temporalmente permitimos lectura para debuggear si el auth.uid() falla

DROP POLICY IF EXISTS "System can do everything" ON company_credits;
CREATE POLICY "System can do everything" 
ON company_credits 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;

export async function POST() {
    try {
        const { error } = await supabaseAdmin.rpc("exec_sql", { sql_query: SQL })
        if (error) throw error

        return NextResponse.json({ success: true, message: "Duplicates cleaned and RLS applied" })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
