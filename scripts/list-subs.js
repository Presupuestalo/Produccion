const Stripe = require("stripe");
require("dotenv").config({ path: ".env" }); // Assuming .env

async function listSubs() {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
        const products = await stripe.products.list({ active: true, limit: 100 });
        console.log("--- SUBSCRIPTION PRODUCTS ---");
        for (const p of products.data) {
            if (p.name.includes("Donación") || p.name.includes("Donacion") || p.name.includes("Plan")) {
                const prices = await stripe.prices.list({ product: p.id, active: true });
                prices.data.forEach(pr => {
                    console.log(`${p.name} (${pr.recurring?.interval}): ${pr.id}`);
                });
            }
        }
    } catch (e) {
        console.error(e.message);
    }
}

listSubs();
