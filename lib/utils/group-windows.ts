// Función para generar una clave única basada en las características de la ventana
export function getWindowKey(window: any): string {
  return [
    window.type || "",
    window.glassType || "",
    window.material || "",
    window.width || 0,
    window.height || 0,
    window.innerColor || "",
    window.outerColor || "",
    window.hasBlind ? "1" : "0",
    window.hasFixedPanel ? "1" : "0",
    window.hasMotor ? "1" : "0",
    window.hasMosquitera ? "1" : "0",
    window.hasCatFlap ? "1" : "0",
  ].join("|")
}

export interface GroupedWindow {
  window: any
  quantity: number
  rooms: string[]
}

// Agrupa ventanas idénticas y devuelve un array con cantidad y habitaciones
export function groupWindows(windows: any[]): GroupedWindow[] {
  const groups = new Map<string, GroupedWindow>()

  for (const window of windows) {
    const key = getWindowKey(window)
    const existing = groups.get(key)

    if (existing) {
      existing.quantity++
      if (window.roomName || window.room) {
        existing.rooms.push(window.roomName || window.room)
      }
    } else {
      groups.set(key, {
        window,
        quantity: 1,
        rooms: window.roomName || window.room ? [window.roomName || window.room] : [],
      })
    }
  }

  return Array.from(groups.values())
}
