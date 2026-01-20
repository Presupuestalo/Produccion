"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  unit: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find((i) => i.id === item.id)

        if (existingItem) {
          set({
            items: items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)),
          })
        } else {
          set({ items: [...items, item] })
        }

        // Recalcular total y cantidad
        const newItems = get().items
        set({
          total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        })
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })

        // Recalcular total y cantidad
        const newItems = get().items
        set({
          total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        })
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return

        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })

        // Recalcular total y cantidad
        const newItems = get().items
        set({
          total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        })
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 })
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)
