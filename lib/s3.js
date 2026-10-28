import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// IDCloudHost Object Storage speaks S3; settings from .env. everything this site stores lives under
// rel.blue/ in the bucket (rel.blue/projects/, rel.blue/achievement/)
const s3 =
  globalThis.__s3 ??
  new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    // non-AWS S3: the bucket goes in the path, not the host
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
if (process.env.NODE_ENV !== "production") globalThis.__s3 = s3;

export const FOLDERS = ["projects", "achievement"];

// stores a public file at rel.blue/<folder>/<name> and returns its public URL
export async function upload(folder, name, body, contentType) {
  const key = `rel.blue/${folder}/${name}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
      // every upload gets a new name, so a file never changes under its URL
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${process.env.S3_PUBLIC_URL}/${key}`;
}
