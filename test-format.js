
const amount = 1200.50;

console.log('--- es-ES Default ---');
console.log(new Intl.NumberFormat('es-ES').format(amount));

console.log('--- es-ES Currency EUR ---');
console.log(new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount));

console.log('--- es-ES with useGrouping: true ---');
console.log(new Intl.NumberFormat('es-ES', { useGrouping: true, minimumFractionDigits: 2 }).format(amount));

console.log('--- toFixed(2).replace(".", ",") ---');
console.log(amount.toFixed(2).replace(".", ","));
