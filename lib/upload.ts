// lib/upload.ts
// Shared browser upload helper using presigned URLs

import { generateR2PresignedUrl, getR2DownloadUrl } from "./api";

export type UploadOptions = {
  file: File;
  prefix?: string;
  visibility?: "public" | "private";
  category?: "image" | "document" | "video";
  onProgress?: (progress: number) => void;
};

export type UploadResult = {
  success: boolean;
  key: string;
  url?: string; // Public URL (only if visibility is "public")
  error?: string;
};

/**
 * Upload a file to R2 using presigned URL
 * This is a reusable helper that can be used by all forms
 * 
 * @param options - Upload options
 * @returns Upload result with key and optional URL
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { file, prefix = "uploads", visibility = "private", category, onProgress } = options;

  try {
    // Validate file object
    if (!file || !(file instanceof File)) {
      return {
        success: false,
        key: "",
        error: "Invalid file object",
      };
    }

    // Validate file name
    if (!file.name || file.name.trim() === "") {
      return {
        success: false,
        key: "",
        error: "File name is required",
      };
    }

    // Validate file size
    if (file.size === undefined || file.size === null || isNaN(file.size) || file.size < 0) {
      return {
        success: false,
        key: "",
        error: `Invalid file size: ${file.size}`,
      };
    }

    // Get MIME type or default
    const mimeType = file.type || "application/octet-stream";

    // Client-side size validation (matches backend limits)
    const MAX_SIZES = {
      image: 10 * 1024 * 1024, // 10 MB
      document: 50 * 1024 * 1024, // 50 MB
      video: 100 * 1024 * 1024, // 100 MB
      default: 50 * 1024 * 1024, // 50 MB
    };

    const fileCategory = category || getFileCategory(mimeType);
    const maxSize = MAX_SIZES[fileCategory] || MAX_SIZES.default;

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return {
        success: false,
        key: "",
        error: `File size exceeds limit. Maximum size for ${fileCategory} is ${maxSizeMB} MB`,
      };
    }

    // Get presigned URL from backend
    const presignedData = await generateR2PresignedUrl({
      fileName: file.name.trim(),
      mimeType: mimeType,
      fileSize: Number(file.size), // Ensure it's a number
      prefix,
      visibility,
      category: fileCategory,
    });

    // Upload file directly to R2 using presigned URL
    const uploadResponse = await fetch(presignedData.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      return {
        success: false,
        key: presignedData.key,
        error: `Upload failed: ${uploadResponse.statusText}`,
      };
    }

    // Report progress
    if (onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      key: presignedData.key,
      url: presignedData.accessUrl, // Only present if visibility is "public"
    };
  } catch (error: unknown) {
    return {
      success: false,
      key: "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload multiple files to R2
 * 
 * @param files - Array of files to upload
 * @param options - Upload options (applied to all files)
 * @returns Array of upload results
 */
export async function uploadFiles(
  files: File[],
  options: Omit<UploadOptions, "file">
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadFile({ ...options, file }))
  );
  return results;
}

/**
 * Get file category from MIME type
 */
function getFileCategory(mimeType: string): "image" | "document" | "video" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

/**
 * Validate file before upload (client-side)
 * 
 * @param file - File to validate
 * @param category - Optional category override
 * @returns Validation result
 */
export function validateFileBeforeUpload(
  file: File,
  category?: "image" | "document" | "video"
): { valid: boolean; error?: string } {
  const MAX_SIZES = {
    image: 10 * 1024 * 1024,
    document: 50 * 1024 * 1024,
    video: 100 * 1024 * 1024,
    default: 50 * 1024 * 1024,
  };

  const fileCategory = category || getFileCategory(file.type);
  const maxSize = MAX_SIZES[fileCategory] || MAX_SIZES.default;

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds limit. Maximum size for ${fileCategory} is ${maxSizeMB} MB`,
    };
  }

  // Check MIME type
  const allowedTypes = {
    image: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ],
    video: [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ],
  };

  const allowed = allowedTypes[fileCategory] || allowedTypes.document;
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types for ${fileCategory}: ${allowed.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Get a download URL for a private file
 * This checks permissions on the backend before returning a presigned URL
 * 
 * @param key - R2 object key
 * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns Download URL
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const result = await getR2DownloadUrl(key, expiresIn);
    return result.downloadUrl;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : "Failed to get download URL");
  }
}

