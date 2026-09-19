import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export interface SnapshotUploadResult {
  fileId: string;
  key: string;
  url: string;
}

/**
 * Uploads a base64 or binary JPEG snapshot to S3 (or falls back gracefully to data-URI if AWS is unconfigured),
 * creates a File record in Neon DB, and returns the file details.
 */
export async function uploadProctorSnapshot(params: {
  contestId: string;
  proctorSessionId: string;
  violationId: string;
  base64Data: string;
  userId?: string;
}): Promise<SnapshotUploadResult | null> {
  const { contestId, proctorSessionId, violationId, base64Data, userId } = params;

  try {
    // Strip data:image/jpeg;base64, header if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const timestamp = Date.now();
    const key = `proctoring/${contestId}/${proctorSessionId}/${violationId}_${timestamp}.jpg`;
    const mimeType = "image/jpeg";
    const size = buffer.length;

    let s3UploadSuccess = false;
    let fallbackUrl = "";

    // Check if real AWS S3 credentials are configured (ignore placeholders)
    const hasAwsCreds = Boolean(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY &&
      !process.env.AWS_ACCESS_KEY_ID.includes("your_aws_access_key_id")
    );

    if (hasAwsCreds) {
      try {
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        });
        await s3Client.send(command);
        s3UploadSuccess = true;
      } catch (s3Err) {
        console.warn("[S3 Snapshots] Failed to upload to S3, falling back to local storage:", s3Err);
      }
    }

    if (!s3UploadSuccess) {
      // In local dev without AWS, store base64 data URI so preview still works seamlessly
      fallbackUrl = `data:${mimeType};base64,${cleanBase64}`;
    }

    // Create File record in Neon PostgreSQL
    const file = await prisma.file.create({
      data: {
        bucket: s3UploadSuccess ? BUCKET_NAME : "local-memory",
        key: key,
        url: s3UploadSuccess ? `https://${BUCKET_NAME}.s3.amazonaws.com/${key}` : fallbackUrl,
        mimeType: mimeType,
        size: size,
        uploadedById: userId || null,
      },
    });

    return {
      fileId: file.id,
      key: file.key,
      url: file.url,
    };
  } catch (error) {
    console.error("[uploadProctorSnapshot] Critical error saving snapshot:", error);
    return null;
  }
}

/**
 * Generates an authenticated, time-limited presigned GET URL for viewing an S3 snapshot.
 * If the file is stored locally as a data URL, returns the data URL directly.
 */
export async function getPresignedSnapshotUrl(file: {
  bucket: string;
  key: string;
  url?: string | null;
}, expiresInSeconds = 900): Promise<string> {
  // If stored as local fallback (data URL), return directly
  if (file.bucket === "local-memory" || file.url?.startsWith("data:")) {
    return file.url || "";
  }

  const hasAwsCreds = Boolean(
    process.env.AWS_ACCESS_KEY_ID && 
    process.env.AWS_SECRET_ACCESS_KEY &&
    !process.env.AWS_ACCESS_KEY_ID.includes("your_aws_access_key_id")
  );

  if (!hasAwsCreds) {
    return file.url || "";
  }

  try {
    const command = new GetObjectCommand({
      Bucket: file.bucket || BUCKET_NAME,
      Key: file.key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error("[getPresignedSnapshotUrl] Failed to sign URL for key:", file.key, err);
    return file.url || "";
  }
}
