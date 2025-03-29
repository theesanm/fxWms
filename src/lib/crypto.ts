import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hash(password: string): Promise<string> {
    if (!password) {
        throw new Error('Password is required');
    }
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}




