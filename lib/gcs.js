import { Storage } from "@google-cloud/storage";

const storage = new Storage(
  process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY
    ? {
      credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
    }
    : {}
);

const bucketName =
  process.env.GCS_KNOWLEDGE_BASE || process.env.GCS_BUCKET_NAME || "test-bucket";

export const bucket = bucketName ? storage.bucket(bucketName) : null;

export async function uploadToBucket(filename, file, contentType) {
  if (!bucket) return null;
  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
  const type = contentType || (file.type ?? "application/octet-stream");
  const gcsFile = bucket.file(filename);
  await gcsFile.save(buffer, { contentType: type });

  let url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  try {
    await gcsFile.makePublic();
  } catch {
    const [signedUrl] = await gcsFile.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    url = signedUrl;
  }
  return url;
}

export async function refreshImageUrl(url) {
  if (!bucket || !url) return url;

  try {
    let path;

    if (url.includes("storage.googleapis.com/")) {
      const match = url.match(/storage\.googleapis\.com\/([^?]+)/);
      if (match) {
        path = match[1];
      } else {
        console.error("Error refreshing image URL: No match found");
        return url;
      }

      if (bucket.name && path.startsWith(bucket.name + "/")) {
        path = path.substring(bucket.name.length + 1);
      }

      const gcsFile = bucket.file(path);
      const [signedUrl] = await gcsFile.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      return signedUrl;
    }

    // If URL format doesn't match, return original
    return url;
  } catch (err) {
    console.error("Error refreshing image URL:", err);
    return url;
  }
}

/** Refresh an array of GCS image URLs to fresh signed URLs so images are always visible. */
export async function refreshImageUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return [];
  return Promise.all(urls.map((u) => refreshImageUrl(u)));
}

const SIGNED_READ_MS = 7 * 24 * 60 * 60 * 1000;

/** Signed read URL for an object path inside the configured bucket (e.g. geetlab/ideas/.../file.webm). */
export async function getSignedReadUrl(gcsPath) {
  if (!bucket || !gcsPath) return null;
  const gcsFile = bucket.file(gcsPath);
  const [signedUrl] = await gcsFile.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + SIGNED_READ_MS,
  });
  return signedUrl;
}

/** Remove object from bucket. */
export async function deleteFile(gcsPath) {
  if (!bucket || !gcsPath) return;
  try {
    await bucket.file(gcsPath).delete({ ignoreNotFound: true });
  } catch (err) {
    console.error("GCS deleteFile:", err);
  }
}