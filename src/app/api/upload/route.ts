import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const buffer = Buffer.from(await file.arrayBuffer())

        // Generate safe filename
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`

        // Ensure absolute path to public/images directory
        const publicDir = path.join(process.cwd(), 'public')
        const imagesDir = path.join(publicDir, 'images')

        try {
            // Ensure directory exists with proper permissions
            await mkdir(imagesDir, { recursive: true, mode: 0o755 })

            // Write file with proper permissions
            const filePath = path.join(imagesDir, filename)
            await writeFile(filePath, buffer, { mode: 0o644 })

            // Return relative path for database storage
            // Make sure the path is consistent with what getImageUrl expects
            const imagePath = `/images/${filename}`;
            console.log('Image uploaded successfully, path:', imagePath);

            return NextResponse.json({
                success: true,
                filename: imagePath
            })
        } catch (fsError) {
            console.error('File system error:', fsError)
            throw new Error(`File system error: ${(fsError as Error).message}`)
        }
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { success: false, error: 'Upload failed: ' + (error as Error).message },
            { status: 500 }
        )
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
}






