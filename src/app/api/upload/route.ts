import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const filename = `${Date.now()}-${file.name}`;
        const publicPath = path.join(process.cwd(), 'public', 'images');
        
        // Ensure the images directory exists
        try {
            await mkdir(publicPath, { recursive: true });
        } catch (err) {
            // Ignore if directory already exists
        }

        const filePath = path.join(publicPath, filename);
        await writeFile(filePath, buffer);

        return NextResponse.json({ filePath: `/images/${filename}` });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
