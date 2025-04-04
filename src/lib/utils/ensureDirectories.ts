import { mkdir } from 'fs/promises';
import path from 'path';

export async function ensureDirectories() {
    const publicImagesPath = path.join(process.cwd(), 'public', 'images');
    
    try {
        await mkdir(publicImagesPath, { recursive: true });
        console.log('Image directory structure verified');
    } catch (error) {
        console.error('Failed to create image directories:', error);
    }
}