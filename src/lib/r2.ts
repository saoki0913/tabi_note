import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, hasR2Config } from "@/lib/env";

const globalForR2 = globalThis as typeof globalThis & {
  __tabiNoteR2?: S3Client;
};

const endpoint = hasR2Config
  ? `https://${env.r2AccountId}.r2.cloudflarestorage.com`
  : undefined;

export const r2 = hasR2Config
  ? globalForR2.__tabiNoteR2 ??
    new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId!,
        secretAccessKey: env.r2SecretAccessKey!,
      },
    })
  : null;

if (r2 && !globalForR2.__tabiNoteR2) {
  globalForR2.__tabiNoteR2 = r2;
}

const toBuffer = async (stream: ReadableStream<Uint8Array> | Blob | undefined) => {
  if (!stream) return Buffer.alloc(0);
  if (stream instanceof Blob) {
    return Buffer.from(await stream.arrayBuffer());
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
};

export const uploadBase64Object = async ({
  key,
  base64,
  contentType,
}: {
  key: string;
  base64: string;
  contentType: string;
}) => {
  if (!r2 || !env.r2Bucket) {
    return null;
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      Body: Buffer.from(base64, "base64"),
      ContentType: contentType,
    }),
  );

  return key;
};

export const uploadBufferObject = async ({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) => {
  if (!r2 || !env.r2Bucket) {
    return null;
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return key;
};

export const downloadObjectBase64 = async (key?: string | null) => {
  if (!r2 || !env.r2Bucket || !key) {
    return null;
  }

  const response = await r2.send(
    new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
    }),
  );

  return (await toBuffer(response.Body as ReadableStream<Uint8Array>)).toString(
    "base64",
  );
};

export const getSignedAssetUrl = async (key?: string | null, expiresIn = 300) => {
  if (!r2 || !env.r2Bucket || !key) {
    return null;
  }

  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
    }),
    { expiresIn },
  );
};
