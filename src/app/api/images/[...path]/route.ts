import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { type NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
    const resolvedParams = await params;
    try {
        // Safely join path components to prevent directory traversal
        const safePath = resolvedParams.path.map(segment =>
            segment.replace(/[^a-zA-Z0-9.-]/g, '')
        )

        // Log the path for debugging
        console.log('Image API request path:', safePath);

        const imagePath = path.join(process.cwd(), 'public', 'images', ...safePath)
        console.log('Full image path:', imagePath);

        try {
            const imageBuffer = await readFile(imagePath)

            // Determine content type based on file extension
            const ext = path.extname(imagePath).toLowerCase()
            const contentType = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
            }[ext] || 'application/octet-stream'

            console.log('Image found, serving with content type:', contentType);

            // Return the image with appropriate headers
            return new NextResponse(imageBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            })
        } catch (readError) {
            console.error('Error reading image file:', readError);
            console.error('Image path that failed:', imagePath);
            return new NextResponse('Image not found', { status: 404 })
        }
    } catch (error) {
        console.error('Image serving error:', error)
        return new NextResponse('Image not found', { status: 404 })
    }
}

// Define segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

