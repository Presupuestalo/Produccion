import Stripe from "stripe"
import dotenv from "dotenv"

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
})

async function getPriceIds() {
    const prices = await stripe.prices.list({
        active: true,
        limit: 100,
        expand: ['data.product']
    })

    console.log("--- STRIPE PRICE IDS ---")
    prices.data.forEach(p => {
        const product = p.product as Stripe.Product
        console.log(`${product.name} (${p.recurring?.interval || 'one-time'}): ${p.id}`)
    })
}

getPriceIds()
