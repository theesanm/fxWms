const bcrypt = require('bcrypt');

async function generateHash(password: string) {
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Hash:', hash);
}

// Generate hash for 'password123'
generateHash('password123').catch(console.error);
