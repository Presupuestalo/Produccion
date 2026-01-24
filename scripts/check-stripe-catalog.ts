import Stripe from "stripe"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(__dirname, "../.env.local") })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-11-20.acacia" as any,
})

async function checkCatalog() {
    console.log("=== STRIPE FULL CATALOG REPORT ===")
    const products = await stripe.products.list({ active: true, limit: 100 })

    for (const product of products.data) {
        console.log(`\nPRODUCT: "${product.name}" (ID: ${product.id})`)
        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 })
        for (const price of prices.data) {
            console.log(`  - PRICE: ${price.unit_amount} cents ${price.currency.toUpperCase()} | Type: ${price.recurring?.interval || "one-time"} | ID: ${price.id}`)
        }
    }
}

checkCatalog().catch(console.error)
