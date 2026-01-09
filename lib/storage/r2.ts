import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
});

export async function uploadAvatar(file: File, userId: string): Promise<string> {
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!publicUrl) {
        console.error('CLOUDFLARE_R2_PUBLIC_URL is not set:', process.env);
        throw new Error('R2 public URL is not configured. Please set CLOUDFLARE_R2_PUBLIC_URL in .env.local');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${userId}-${Date.now()}.${fileExt}`;

    const buffer = await file.arrayBuffer();

    await r2.send(new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: fileName,
        Body: Buffer.from(buffer),
        ContentType: file.type,
    }));

    console.log('Avatar uploaded successfully:', `${publicUrl}/${fileName}`);
    return `${publicUrl}/${fileName}`;
}
