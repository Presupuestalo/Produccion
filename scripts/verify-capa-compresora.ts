
// @ts-nocheck
import { BudgetGenerator } from "../lib/services/budget-generator"

async function verify() {
    console.log("Starting self-contained verification for Compressive Layer Logic...")

    const mockData = {
        project: {
            structure_type: "Madera"
        },
        demolition: {
            rooms: [
                {
                    type: "Baño",
                    number: 1,
                    area: 10,
                    floorMaterial: "Madera", // Original
                    removeFloor: true
                },
                {
                    type: "Salón",
                    number: 1,
                    area: 30,
                    floorMaterial: "Madera",
                    removeFloor: true
                }
            ],
            config: {}
        },
        reform: {
            rooms: [
                {
                    type: "Baño",
                    number: 1,
                    area: 10,
                    floorMaterial: "Parquet flotante" // Reformado (Non-ceramic in wet area)
                },
                {
                    type: "Salón",
                    number: 1,
                    area: 30,
                    floorMaterial: "Parquet flotante" // Reformado (Non-ceramic in dry area)
                }
            ],
            config: {}
        },
        globalConfig: {
            structureType: "Madera"
        }
    }

    // Mock Supabase and catalog loading
    const mockSupabase = {
        auth: { getUser: () => Promise.resolve({ data: { user: { id: "test" } } }) },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: { price_multiplier: 1 } }),
                    limit: () => Promise.resolve({ data: [] })
                }),
                order: () => Promise.resolve({ data: [] })
            })
        })
    }

    const generator = new BudgetGenerator(mockData, mockSupabase)

    // Manually inject mock prices into cache since we're skipping loadPriceCatalog
    generator.priceCache.set("02-A-01", {
        code: "02-A-01",
        category: "ALBAÑILERÍA",
        subcategory: "Soleras",
        description: "Arlita",
        unit: "m2",
        final_price: 20
    })
    generator.priceCache.set("05-C-01", {
        code: "05-C-01",
        category: "CARPINTERÍA",
        subcategory: "Rastrelado",
        description: "Rastrelado",
        unit: "m2",
        final_price: 15
    })

    // Run generate (it might call loadPriceCatalog but we've mocked supabase enough to not crash)
    // Actually generate() calls loadPriceCatalog which we want to skip or let it run with mocks
    const items = await generator.generate()

    const arlita = items.find(item => item.code === "02-A-01")
    const rastrelado = items.find(item => item.code === "05-C-01")

    console.log("\nResults for Wooden Structure + Bathroom with Parquet:")
    console.log(`Arlita (02-A-01) Area: ${arlita?.quantity || 0} m² (Expected: 10)`)
    console.log(`Rastrelado (05-C-01) Area: ${rastrelado?.quantity || 0} m² (Expected: 30)`)

    if (arlita?.quantity === 10 && rastrelado?.quantity === 30) {
        console.log("\nSUCCESS: Logic is correct!")
    } else {
        console.log("\nFAILURE: Check results above.")
        process.exit(1)
    }
}

verify().catch(err => {
    console.error("Verification failed with error:", err)
    process.exit(1)
})
