const Stripe = require("stripe");
require("dotenv").config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getPriceIds() {
    try {
        const prices = await stripe.prices.list({
            active: true,
            limit: 100,
            expand: ['data.product']
        });

        console.log("--- STRIPE PRICE IDS ---");
        prices.data.forEach(p => {
            const product = p.product;
            console.log(`${product.name} (${p.recurring ? p.recurring.interval : 'one-time'}): ${p.id}`);
        });
    } catch (e) {
        console.error(e.message);
    }
}

getPriceIds();
