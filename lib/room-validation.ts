import type { Room } from "@/types/calculator"

export function checkRoomConflict(
    newType: string,
    existingRooms: Room[],
    currentRoomId?: string // Optional: ignore the current room being edited
): { hasConflict: boolean; message?: string } {
    // Filter out the room we might be editing to avoid false positives (conflict with self)
    const otherRooms = currentRoomId
        ? existingRooms.filter((r) => r.id !== currentRoomId)
        : existingRooms

    // 1. Check for Duplicate Salón
    if (newType === "Salón") {
        const hasSalon = otherRooms.some((r) => r.type === "Salón")
        const hasCocinaAmericana = otherRooms.some((r) => r.type === "Cocina Americana")

        if (hasSalon) {
            return {
                hasConflict: true,
                message: "Ya existe un Salón en este proyecto. ¿Estás seguro de que quieres añadir otro?",
            }
        }
        if (hasCocinaAmericana) {
            return {
                hasConflict: true,
                message: "Ya existe una Cocina Americana (que incluye Salón). ¿Estás seguro de que quieres añadir un Salón independiente?",
            }
        }
    }

    // 2. Check for Duplicate Cocina
    if (newType === "Cocina") {
        const hasCocina = otherRooms.some((r) => r.type === "Cocina")
        const hasCocinaAmericana = otherRooms.some((r) => r.type === "Cocina Americana")

        if (hasCocina) {
            return {
                hasConflict: true,
                message: "Ya existe una Cocina en este proyecto. ¿Estás seguro de que quieres añadir otra?",
            }
        }
        if (hasCocinaAmericana) {
            return {
                hasConflict: true,
                message: "Ya existe una Cocina Americana (que incluye Cocina). ¿Estás seguro de que quieres añadir una Cocina independiente?",
            }
        }
    }

    // 3. Check for Cocina Americana conflicts
    if (newType === "Cocina Americana") {
        const hasCocinaAmericana = otherRooms.some((r) => r.type === "Cocina Americana")
        const hasSalon = otherRooms.some((r) => r.type === "Salón")
        const hasCocina = otherRooms.some((r) => r.type === "Cocina")

        if (hasCocinaAmericana) {
            return {
                hasConflict: true,
                message: "Ya existe una Cocina Americana en este proyecto. ¿Estás seguro de que quieres añadir otra?",
            }
        }

        if (hasSalon && hasCocina) {
            return {
                hasConflict: true,
                message: "Ya existen un Salón y una Cocina en el proyecto. Una Cocina Americana suele sustituirlos. ¿Estás seguro?"
            }
        }

        if (hasSalon) {
            return {
                hasConflict: true,
                message: "Ya existe un Salón en el proyecto. ¿Estás seguro de añadir una Cocina Americana (que ya lo incluye)?",
            }
        }

        if (hasCocina) {
            return {
                hasConflict: true,
                message: "Ya existe una Cocina en el proyecto. ¿Estás seguro de añadir una Cocina Americana (que ya la incluye)?",
            }
        }
    }

    return { hasConflict: false }
}
