import { post } from "../../utils/http";
import endpoints from "../../constants/endpoints";

export type PresignedFileRequest = {
    fileName: string;
    contentType: string;
};

export type PresignedFileResponse = {
    success: boolean;
    message?: string;
    data?: {
        url?: string;
    };
};

export type MultiplePresignedFileResponse = {
    success: boolean;
    message?: string;
    data?: {
        urls?: string[];
    };
}

export const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
};

export const normalizeContentType = (type?: string): string => {
  if (!type) return "image/jpeg"; // default fallback

  const lower = type.toLowerCase();

  if (lower === "image/jpg") return "image/jpeg";
  if (lower === "image/heic" || lower === "image/heif") return "image/heic";

  return lower;
};

export const getProfileImagePresignedImageUrl = async (
    file: PresignedFileRequest
): Promise<PresignedFileResponse> => {
    try {
        const data = {
            file_name: file.fileName,
            content_type: file.contentType
        }

        const response = await post<typeof data, undefined, PresignedFileResponse>(
            endpoints.user_profile.UPDATE_PROFILE_IMAGE,
            data
        );

        return response;
    } catch (error) {
        console.error("Error getting presigned URL:", error);
        throw error;
    }
};

export const getAnalyzerImagePresignedImageUrl = async (
    file: PresignedFileRequest
): Promise<PresignedFileResponse> => {
    try {
        const data = {
            file_name: file.fileName,
            content_type: file.contentType
        }

        const response = await post<typeof data, undefined, PresignedFileResponse>(
            endpoints.analyzer.GET_ANALYZER_IMAGE_PRESIGNED_URL,
            data
        );

        return response;
    } catch (error) {
        console.error("Error getting presigned URL:", error);
        throw error;
    }
}

/**
 * Extract public URL from presigned URL by removing query parameters
 * @param presignedUrl - Presigned URL with query parameters
 * @returns Public URL without query parameters
 */
export const extractPublicUrl = (presignedUrl: string): string => {
    const [base] = presignedUrl.split("?");
    return base;
};

/**
 * Guess MIME type from file name
 * @param fileName - File name with extension
 * @returns MIME type string
 */
export const guessMimeTypeFromFileName = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    return "image/jpeg"; // Default to JPEG
};

/**
 * Upload group icon to presigned URL
 */
export const getGroupIconPresignedImageUrl = async (file: PresignedFileRequest) : Promise<PresignedFileResponse> =>{
    try {
         const data = {
            file_name: file.fileName,
            content_type: file.contentType
        }

        const response = await post<typeof data, undefined, PresignedFileResponse>(
            endpoints.group.PRESIGNED_GROUP_URL,
            data
        );

        return response;
    } catch (error) {
        console.error("Error getting presigned URL:", error);
        throw error;
    }
}

/**
 * Upload file to presigned URL using XMLHttpRequest (works better with React Native)
 * @param fileUri - Local file URI
 * @param presignedUrl - Presigned URL for upload
 * @param contentType - Content type of the file
 * @returns Promise<boolean> - Success status
 */
export const uploadFileToPresignedUrl = async (
    fileUri: string,
    presignedUrl: string,
    contentType: string,
    name : string = "profile-image"
): Promise<boolean> => {
    return new Promise((resolve) => {
        try {
            const xhr = new XMLHttpRequest();

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(true);
                } else {
                    console.error("Upload failed with status:", xhr.status);
                    resolve(false);
                }
            };

            xhr.onerror = () => {
                console.error("Upload error:", xhr.statusText);
                resolve(false);
            };

            xhr.open("PUT", presignedUrl);
            xhr.setRequestHeader("Content-Type", contentType);

            // For React Native, convert file URI to blob for upload
            fetch(fileUri)
                .then((res) => res.blob())
                .then((blob) => {
                    xhr.send(blob);
                })
                .catch((error) => {
                    console.error("Error creating blob:", error);
                    // Fallback: try direct fetch upload with FormData
                    const formData = new FormData();
                    formData.append("file", {
                        uri: fileUri,
                        type: contentType,
                        name: name,
                    } as any);

                    fetch(presignedUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": contentType,
                        },
                        body: formData as any,
                    })
                        .then((response) => {
                            console.log("response", response);
                            resolve(response.ok);
                        })
                        .catch(() => {
                            resolve(false);
                        });
                });
        } catch (error) {
            console.error("Error uploading file to presigned URL:", error);
            resolve(false);
        }
    });
};