import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { error } = await supabaseAdmin.rpc("exec_sql", {
            sql: `
        CREATE TABLE IF NOT EXISTS public.debug_logs (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          message text NOT NULL,
          data jsonb DEFAULT '{}'::jsonb
        );

        -- Habilitar RLS pero permitir que service_role escriba
        ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
        
        -- Política para que el admin pueda borrar/ver todo
        DROP POLICY IF EXISTS "Enable all access for admin" ON public.debug_logs;
        CREATE POLICY "Enable all access for admin" ON public.debug_logs
          USING (true)
          WITH CHECK (true);
      `,
        })

        if (error) {
            console.error("Error setup debug table:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Debug logs table ready" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
