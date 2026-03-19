import { useState, useRef } from "react";
import { launchImageLibrary, Asset } from "react-native-image-picker";

import useTranslation from "./useTranslation";
import { toastMessageError } from "../components/common/ToastMessage";
import {
  IMAGE_FILE_SIZE,
  ANALYZER_IMAGE_QUALITY,
  ANALYZER_IMAGE_MAX_DIMENSION
} from "../constants/commonConstant";
import {
  mimeToExt,
  normalizeContentType,
  getAnalyzerImagePresignedImageUrl,
  uploadFileToPresignedUrl,
} from "../services/upload/presignedUpload";
import useAuth from "./useAuth";

const ALLOWED_EXTENSIONS = ["jpeg", "jpg", "png"];

interface UseAnalyzerImagesReturn {
  preselectedImages: Asset[];
  uploadedImages: Asset[];
  setPreselectedImages: React.Dispatch<React.SetStateAction<Asset[]>>;
  setUploadedImages: React.Dispatch<React.SetStateAction<Asset[]>>;
  handleImagePick: () => void;
  handleRemoveImage: (index: number, isPreselected: boolean) => void;
  getPresignedUrlsPerImage: (profileId: number) => Promise<string[]>;
  resetImages: () => void;
  lastUploadRef: React.MutableRefObject<{ signature: string; urls: string[] }>;
}

const useAnalyzerImages = (): UseAnalyzerImagesReturn => {
  const { t } = useTranslation();
  const { authData } = useAuth();
  const currentPlan = authData?.plan;
  const [preselectedImages, setPreselectedImages] = useState<Asset[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Asset[]>([]);
  const lastUploadRef = useRef<{ signature: string; urls: string[] }>({
    signature: "",
    urls: [],
  });

  const handleImagePick = () => {

    const imageLimit = Number(currentPlan?.limits?.limit)

    const totalImages = preselectedImages.length + uploadedImages.length;
    const remainingSlots = imageLimit - totalImages;

    if (remainingSlots <= 0) {
      toastMessageError(
        t("analyzer.text_analyzer.limit_reached", {
          limit: imageLimit
        })
      );
      return;
    }

    launchImageLibrary(
      {
        mediaType: "photo",
        quality: ANALYZER_IMAGE_QUALITY,
        maxWidth: ANALYZER_IMAGE_MAX_DIMENSION,
        maxHeight: ANALYZER_IMAGE_MAX_DIMENSION,
        selectionLimit: remainingSlots,
      },
      async (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          toastMessageError(
            response.errorMessage ||
              t("analyzer.text_analyzer.failed_to_pick_image")
          );
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const validAssets = response.assets.filter((asset) => {
            const sizeOk =
              !asset.fileSize ||
              asset.fileSize <= IMAGE_FILE_SIZE * 1024 * 1024;
            const fileName = asset.fileName || "";
            const extFromName = fileName.split(".").pop()?.toLowerCase();
            const type = asset.type || "";
            const extFromType = type.split("/").pop()?.toLowerCase();
            const extensionOk =
              (extFromName && ALLOWED_EXTENSIONS.includes(extFromName)) ||
              (extFromType && ALLOWED_EXTENSIONS.includes(extFromType));
            return sizeOk && extensionOk;
          });

          if (validAssets.length !== response.assets.length) {
            toastMessageError(
              t("analyzer.text_analyzer.image_file_requirements_message", {
                size: IMAGE_FILE_SIZE,
              })
            );
            if (validAssets.length === 0) {
              return;
            }
          }

          const newImages = validAssets.slice(0, remainingSlots);
          setUploadedImages((prevImages) => [...prevImages, ...newImages]);
        }
      }
    );
  };

  const handleRemoveImage = (index: number, isPreselected: boolean = false) => {
    if (isPreselected) {
      setPreselectedImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const adjustedIndex = index - preselectedImages.length;
      setUploadedImages((prev) => prev.filter((_, i) => i !== adjustedIndex));
    }
  };

  const getPresignedUrlsPerImage = async (profileId: number): Promise<string[]> => {
    const currentTime = Date.now();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < uploadedImages.length; i++) {
      const item = uploadedImages[i];
      if (item.uri?.startsWith("http")) {
        continue;
      }
      const contentType = normalizeContentType(item.type);
      const ext = mimeToExt[contentType] || "jpg";

      const newFileName = `analyzer/${profileId}_${currentTime}_${i}.${ext}`;

      const uploadFileData = {
        fileName: newFileName,
        contentType: contentType,
      };

      const presignedUrlResponse =
        await getAnalyzerImagePresignedImageUrl(uploadFileData);

      if (
        !presignedUrlResponse.success ||
        !presignedUrlResponse.data?.url ||
        presignedUrlResponse.data.url === undefined
      ) {
        toastMessageError(
          presignedUrlResponse.message ||
            t("analyzer.text_analyzer.prepare_image_upload_failed")
        );
        return [];
      }

      const presignedUrl = presignedUrlResponse.data.url;

      if (!item.uri || !presignedUrl || !contentType) {
        toastMessageError(t("analyzer.text_analyzer.invalid_file_upload_data"));
        return [];
      }

      const ok = await uploadFileToPresignedUrl(
        item.uri,
        presignedUrl,
        contentType,
        "analyzer"
      );

      if (!ok) {
        toastMessageError(t("analyzer.text_analyzer.file_upload_failed"));
        return [];
      }

      uploadedUrls.push(presignedUrl);
    }

    return uploadedUrls;
  };

  const resetImages = () => {
    setPreselectedImages([]);
    setUploadedImages([]);
    lastUploadRef.current = { signature: "", urls: [] };
  };

  return {
    preselectedImages,
    uploadedImages,
    setPreselectedImages,
    setUploadedImages,
    handleImagePick,
    handleRemoveImage,
    getPresignedUrlsPerImage,
    resetImages,
    lastUploadRef,
  };
};

export default useAnalyzerImages;
