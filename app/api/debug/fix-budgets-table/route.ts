import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const sql = `
      -- Add columns to store accepted budget information
      ALTER TABLE budgets
      ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS accepted_amount_without_vat NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS accepted_amount_with_vat NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS accepted_vat_rate NUMERIC(5, 2),
      ADD COLUMN IF NOT EXISTS accepted_vat_amount NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS accepted_includes_vat BOOLEAN DEFAULT true;

      -- Add comment to explain the columns
      COMMENT ON COLUMN budgets.accepted_at IS 'Timestamp when the budget was accepted by the client';
      COMMENT ON COLUMN budgets.accepted_amount_without_vat IS 'Total amount without VAT at the time of acceptance';
      COMMENT ON COLUMN budgets.accepted_amount_with_vat IS 'Total amount with VAT at the time of acceptance';
      COMMENT ON COLUMN budgets.accepted_vat_rate IS 'VAT rate percentage at the time of acceptance';
      COMMENT ON COLUMN budgets.accepted_vat_amount IS 'VAT amount at the time of acceptance';
      COMMENT ON COLUMN budgets.accepted_includes_vat IS 'Whether the accepted budget includes VAT or not';
    `

        // Intentar ejecutar el SQL mediante la función exec_sql si existe
        const { error: rpcError } = await supabaseAdmin.rpc("exec_sql", { sql })

        if (rpcError) {
            console.error("Error running migration via exec_sql:", rpcError)
            return NextResponse.json({
                success: false,
                error: rpcError,
                message: "No se pudo ejecutar la migración automáticamente. Por favor, ejecuta el contenido de 'scripts/add_accepted_budget_columns.sql' manualmente en el Editor SQL de Supabase.",
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: "Columnas de presupuesto aceptado añadidas correctamente",
        })
    } catch (error: any) {
        console.error("Error:", error)
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 })
    }
}
