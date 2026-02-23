"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { FileText, Settings } from "lucide-react"
import Link from "next/link"

interface CompanyBrandingBlockProps {
    userId?: string
    className?: string
}

export function CompanyBrandingBlock({ userId, className }: CompanyBrandingBlockProps) {
    const [companySettings, setCompanySettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true)
                const supabase = await getSupabase()
                if (!supabase) return

                let targetUserId = userId

                if (!targetUserId) {
                    const { data: { session } } = await supabase.auth.getSession()
                    targetUserId = session?.user?.id
                }

                if (!targetUserId) return
                setCurrentUserId(targetUserId)

                const { data: companyData } = await supabase
                    .from("user_company_settings")
                    .select("*")
                    .eq("user_id", targetUserId)
                    .maybeSingle()

                setCompanySettings(companyData)
            } catch (error) {
                console.error("Error fetching company branding:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [userId])

    if (loading) {
        return (
            <div className={`h-16 w-full max-w-sm bg-slate-50 animate-pulse rounded-2xl border border-slate-100 ${className}`} />
        )
    }

    if (!companySettings?.company_name) {
        return (
            <Link
                href="/dashboard/empresa"
                className={`flex flex-col items-center gap-1 group px-8 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all text-slate-400 hover:text-orange-600 w-full max-w-md ${className}`}
            >
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-wider">Perfil de Empresa Incompleto</span>
                </div>
                <span className="text-[10px] font-medium opacity-60">Configura tu logo y datos fiscales para presupuestos profesionales</span>
            </Link>
        )
    }

    return (
        <div className={`flex items-center gap-4 bg-white border border-slate-200 p-2 px-4 rounded-xl shadow-sm hover:shadow-md transition-all group ${className}`}>
            {companySettings.company_logo_url && (
                <div className="relative h-10 w-24 border-r border-slate-100 pr-4 shrink-0 flex items-center justify-center">
                    <img
                        src={companySettings.company_logo_url}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                </div>
            )}
            <div className="flex flex-col items-start justify-center min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[16px] font-black text-slate-900 uppercase tracking-tight truncate leading-tight">
                        {companySettings.company_name}
                    </span>
                    {companySettings.company_tax_id && (
                        <span className="text-[9px] font-bold text-slate-400 border border-slate-100 px-1 rounded uppercase">
                            {companySettings.company_tax_id}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-y-0.5 mt-0.5">
                    <div className="flex items-center justify-start gap-1.5 text-[10px] text-slate-500 font-medium">
                        <div className="w-1 h-1 rounded-full bg-orange-400" />
                        <span className="truncate">{companySettings.company_address || "Sin dirección"}</span>
                        {companySettings.company_city && (
                            <span className="text-slate-300">| {companySettings.company_city}</span>
                        )}
                    </div>
                    <div className="flex items-center justify-start gap-4 text-[10px] font-bold">
                        {companySettings.company_phone && (
                            <span className="text-slate-700 flex items-center gap-1">
                                <span className="text-slate-300 font-normal">Telf:</span> {companySettings.company_phone}
                            </span>
                        )}
                        {companySettings.company_email && (
                            <span className="text-orange-600 flex items-center gap-1">
                                <span className="text-slate-300 font-normal italic">@</span> {companySettings.company_email}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <Link
                href="/dashboard/empresa"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-orange-600"
                title="Editar datos de empresa"
            >
                <Settings className="h-4 w-4" />
            </Link>
        </div>
    )
}
