
const amount = 12000.50;

function formatCurrency(amount) {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(amount)
}

function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: true,
    }).format(value)
}

function formatDecimalInput(num) {
    return new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(num)
}

console.log('--- 12,000.50 Tests ---');
console.log('Currency:', formatCurrency(amount));
console.log('Number:', formatNumber(amount));
console.log('Decimal Input:', formatDecimalInput(amount));

const largeAmount = 1234567.89;
console.log('\n--- 1,234,567.89 Tests ---');
console.log('Currency:', formatCurrency(largeAmount));
console.log('Number:', formatNumber(largeAmount));
console.log('Decimal Input:', formatDecimalInput(largeAmount));
