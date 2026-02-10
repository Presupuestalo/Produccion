async function testApi() {
    try {
        const response = await fetch('http://localhost:3000/api/ia/generate-designs', {
            method: 'POST'
        });
        console.log('Status:', response.status);
    } catch (e) {
        console.error('Error:', e);
    }
}
testApi();
