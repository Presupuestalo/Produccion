"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { createProfessionalWork, updateProfessionalWork } from "@/lib/services/professional-work-service"
import type { ProfessionalWork } from "@/types/professional-work"
import { PhotoGallerySection } from "./photo-gallery-section"
import { Loader2, Save } from "lucide-react"

const workSchema = z.object({
    title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    location: z.string().optional(),
    project_date: z.string().optional(),
    is_published: z.boolean().default(false),
})

type WorkFormValues = z.infer<typeof workSchema>

interface WorkFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    onPhotoUpdate?: () => void
    work?: ProfessionalWork
}

export function WorkFormDialog({ isOpen, onClose, onSuccess, onPhotoUpdate, work }: WorkFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("basic")
    const { toast } = useToast()

    const form = useForm<WorkFormValues>({
        resolver: zodResolver(workSchema),
        defaultValues: {
            title: "",
            description: "",
            location: "",
            project_date: "",
            is_published: false,
        },
    })

    useEffect(() => {
        if (work) {
            let formattedDate = ""
            if (work.project_date) {
                try {
                    formattedDate = new Date(work.project_date).toISOString().split("T")[0]
                } catch (e) {
                    console.error("Error parsing date:", e)
                }
            }
            form.reset({
                title: work.title,
                description: work.description || "",
                location: work.location || "",
                project_date: formattedDate,
                is_published: work.is_published,
            })
        } else {
            form.reset({
                title: "",
                description: "",
                location: "",
                project_date: "",
                is_published: false,
            })
        }
    }, [work, form, isOpen])

    const onSubmit = async (values: WorkFormValues) => {
        setIsLoading(true)
        try {
            const payload = {
                ...values,
                project_date: values.project_date === "" ? null : values.project_date
            }
            if (work) {
                await updateProfessionalWork(work.id, payload as any)
                toast({ title: "Trabajo actualizado", description: "Los cambios han sido guardados" })
            } else {
                await createProfessionalWork(payload as any)
                toast({ title: "Trabajo creado", description: "Ya puedes añadir fotos a este trabajo" })
            }
            onSuccess()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar el trabajo",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{work ? "Editar Trabajo" : "Nuevo Trabajo"}</DialogTitle>
                    <DialogDescription>
                        Completa la información de tu trabajo para mostrarlo en tu galería.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Información Básica</TabsTrigger>
                        <TabsTrigger value="photos" disabled={!work}>Galería de Fotos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 py-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Título del Proyecto</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Reforma integral en Chamberí" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe el trabajo realizado, materiales, retos..."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ubicación</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Madrid, España" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="project_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha de Finalización</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="is_published"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Publicar en galería</FormLabel>
                                                <FormDescription>
                                                    Si está activado, este trabajo será visible para los clientes.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        {work ? "Guardar Cambios" : "Crear y Continuar"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="photos" className="py-4">
                        {work && (
                            <PhotoGallerySection
                                work={work}
                                onUpdate={onPhotoUpdate || onSuccess}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
