"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Pencil, Save, X, Loader2 } from "lucide-react"
import {
    getPriceCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    type PriceCategory,
} from "@/lib/services/price-service"
import { useToast } from "@/hooks/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CategoryManagerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCategoriesChange?: () => void
}

export function CategoryManagerDialog({ open, onOpenChange, onCategoriesChange }: CategoryManagerDialogProps) {
    const [categories, setCategories] = useState<PriceCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [editingCategory, setEditingCategory] = useState<PriceCategory | null>(null)
    const [deletingCategory, setDeletingCategory] = useState<PriceCategory | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (open) {
            loadCategories()
        }
    }, [open])

    async function loadCategories() {
        try {
            setLoading(true)
            const data = await getPriceCategories()
            setCategories(data)
        } catch (error) {
            console.error("Error loading categories:", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las categorías.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateCategory() {
        if (!newCategoryName.trim()) return

        try {
            setIsSubmitting(true)
            await createCategory(newCategoryName.trim())
            setNewCategoryName("")
            await loadCategories()
            onCategoriesChange?.()
            toast({
                title: "Categoría creada",
                description: "La categoría se ha creado correctamente.",
            })
        } catch (error) {
            console.error("Error creating category:", error)
            toast({
                title: "Error",
                description: "No se pudo crear la categoría.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleUpdateCategory() {
        if (!editingCategory || !editingCategory.name.trim()) return

        try {
            setIsSubmitting(true)
            await updateCategory(editingCategory.id, { name: editingCategory.name })
            setEditingCategory(null)
            await loadCategories()
            onCategoriesChange?.()
            toast({
                title: "Categoría actualizada",
                description: "La categoría se ha actualizado correctamente.",
            })
        } catch (error) {
            console.error("Error updating category:", error)
            toast({
                title: "Error",
                description: "No se pudo actualizar la categoría.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDeleteCategory() {
        if (!deletingCategory) return

        try {
            setIsSubmitting(true)
            await deleteCategory(deletingCategory.id)
            setDeletingCategory(null)
            await loadCategories()
            onCategoriesChange?.()
            toast({
                title: "Categoría eliminada",
                description: "La categoría se ha eliminado correctamente.",
            })
        } catch (error) {
            console.error("Error deleting category:", error)
            toast({
                title: "Error",
                description: "No se pudo eliminar la categoría. Asegúrate de que no tenga precios asociados.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Filtrar solo las categorías del usuario para permitir edición/borrado
    // Las categorías del sistema (user_id === null o undefined) no se pueden modificar
    const userCategories = categories.filter((c) => c.user_id)
    const systemCategories = categories.filter((c) => !c.user_id)

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Gestionar Categorías</DialogTitle>
                        <DialogDescription>
                            Crea y gestiona tus propias categorías de precios. Las categorías del sistema no se pueden modificar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2 py-4">
                        <Input
                            placeholder="Nueva categoría..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                        />
                        <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim() || isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(userCategories.length > 0 || systemCategories.length > 0) ? (
                                    <>
                                        {userCategories.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium text-muted-foreground px-1">Mis Categorías</h3>
                                                {userCategories.map((category) => (
                                                    <div
                                                        key={category.id}
                                                        className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                    >
                                                        {editingCategory?.id === category.id ? (
                                                            <>
                                                                <Input
                                                                    value={editingCategory.name}
                                                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                                    className="h-8"
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") handleUpdateCategory()
                                                                        if (e.key === "Escape") setEditingCategory(null)
                                                                    }}
                                                                />
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleUpdateCategory}>
                                                                    <Save className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCategory(null)}>
                                                                    <X className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="flex-1 text-sm font-medium">{category.name}</span>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => setEditingCategory(category)}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setDeletingCategory(category)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {systemCategories.length > 0 && (
                                            <div className="space-y-2 pt-2">
                                                <h3 className="text-sm font-medium text-muted-foreground px-1">Sistema</h3>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {systemCategories.map((category) => (
                                                        <div key={category.id} className="p-2 text-xs border rounded bg-muted/50 text-muted-foreground truncate">
                                                            {category.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">No hay categorías disponibles.</div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <DialogTitle>¿Eliminar categoría?</DialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la categoría "{deletingCategory?.name}". Si tiene precios asociados, podrían quedar
                            huérfanos o causar errores.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingCategory && handleDeleteCategory()}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
