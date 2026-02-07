export const getDefaultMaterials = (roomType: string, isReform: boolean = true) => {
    switch (roomType) {
        case "Baño":
        case "Cocina":
            if (isReform) {
                return { floor: "Cerámico", wall: "Cerámica" }
            } else {
                // Demolition / Existing State
                return { floor: "Cerámica", wall: "Cerámica" }
            }
        case "Terraza":
            // Reform: Floor Cerámico, Wall No se modifica
            // Demolition: Floor Cerámica, Wall Cerámica? Or "No se modifica"? 
            // Let's assume Terraza in demolition usually has ceramic floor and maybe external walls.
            // Looking at room-card options: Wall options for demolition are: No se modifica, Cerámica, Gotelé, Papel, Pintura.
            // Let's stick to Cerámica for floor in demolition too (spelled "Cerámica" for existing floor material).
            if (isReform) {
                return { floor: "Cerámico", wall: "No se modifica" }
            } else {
                return { floor: "Cerámica", wall: "Cerámica" }
            }
        default:
            // Cocina Americana, Cocina Abierta, Salón, Dormitorio, etc.
            if (isReform) {
                return { floor: "Parquet flotante", wall: "Lucir y pintar" }
            } else {
                // Demolition defaults
                return { floor: "Madera", wall: "Pintura" }
            }
    }
}
