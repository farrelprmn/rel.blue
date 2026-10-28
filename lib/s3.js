import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 =
  globalThis.__s3 ??
  new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
if (process.env.NODE_ENV !== "production") globalThis.__s3 = s3;

export const FOLDERS = ["projects", "achievement"];

export async function upload(folder, name, body, contentType) {
  const key = `rel.blue/${folder}/${name}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${process.env.S3_PUBLIC_URL}/${key}`;
}
