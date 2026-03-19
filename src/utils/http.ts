import axios, { AxiosResponse } from "axios";
import { retrieveData, StorageKeys } from "../storage";
import config from "../config/config";
import { toastMessageError } from "../components/common/ToastMessage";
import { captureApiError, captureException } from "./sentry";
import { logoutUser } from "../stateManagement/features/authSlice";

export const http = axios.create({
  baseURL: config.baseUrl,
  headers: {
    "Content-Type": "application/json",
    // Required for ngrok-free.app to bypass warning page
    "ngrok-skip-browser-warning": "true",
  },
});

// --- Pending request cancellation manager ---
const pendingControllers = new Set<AbortController>();

/**
 * Cancel all in-flight API requests.
 * Call this during logout so background requests don't block the process
 * or cause errors after auth state is cleared.
 */
export const cancelAllPendingRequests = (): void => {
  pendingControllers.forEach((controller) => {
    controller.abort();
  });
  pendingControllers.clear();
};

// Request interceptor to add auth token and attach abort signal
http.interceptors.request.use(
  async (req) => {
    // Attach an AbortController so the request can be cancelled on logout
    const controller = new AbortController();
    req.signal = controller.signal;
    pendingControllers.add(controller);

    const storedAuthData = await retrieveData(StorageKeys.authData);

    if (storedAuthData) {
      const token = JSON.parse(storedAuthData).token;
      if (token && req.headers) req.headers.authorization = `Bearer ${token}`;
    }

    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
http.interceptors.response.use(
  (response) => {
    // Remove the controller from the set once the request completes
    if (response.config.signal) {
      pendingControllers.forEach((controller) => {
        if (controller.signal === response.config.signal) {
          pendingControllers.delete(controller);
        }
      });
    }

    return response.data;
  },
  async (error) => {
    // Remove the controller from the set on error as well
    if (error.config?.signal) {
      pendingControllers.forEach((controller) => {
        if (controller.signal === error.config.signal) {
          pendingControllers.delete(controller);
        }
      });
    }

    // If the request was cancelled (e.g. during logout), silently reject
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject({
        message: "Request cancelled",
        cancelled: true,
        success: false,
      });
    }

    // Capture API errors in Sentry
    if (error.config) {
      captureApiError(error, {
        endpoint: error.config.url || "",
        method: error.config.method || "unknown",
        params: error.config.params,
      });
    } else {
      captureException(error);
    }

    // Global error handling for all status codes
    if (error.response?.status) {
      const errorData = error.response?.data;
      const statusCode = error.response.status;
      const apiStatusCode = errorData?.status_code;

      // Handle 401 Unauthorized - logout user
      if (statusCode === 401 || apiStatusCode === 401) {
        console.error("401 Unauthorized error detected - logging out user");
        // Logout user (clears auth data, which will trigger Router to show AuthStack)
        logoutUser().catch((logoutError) => {
          console.error("Error during automatic logout:", logoutError);
        });

        // Return error with session expired message
        return Promise.reject({
          message: "Session expired. Please login again.",
          status_code: 401,
          status: 401,
          success: false,
        });
      }

      // Return the error data - this will be caught in the catch block of the calling function
      return Promise.reject(errorData);
    }

    // For network errors or other issues
    return Promise.reject({
      message: "Network error. Please check your connection.",
      status: 0,
      success: false,
    });
  }
);

export function get<P, R>(url: string, params?: P): Promise<R> {
  return http({
    method: "get",
    url,
    params,
  });
}

export function post<D, P, R>(url: string, data: D, params?: P): Promise<R> {
  return http({
    method: "post",
    url,
    data,
    params,
  });
}

export function put<D, P, R>(url: string, data: D, params?: P): Promise<R> {
  return http({
    method: "put",
    url,
    data,
    params,
  });
}

export function patch<D, P, R>(url: string, data: D, params?: P): Promise<AxiosResponse<R>> {
  return http({
    method: "patch",
    url,
    data,
    params,
  });
}

export function remove<P, R>(url: string, params?: P): Promise<R> {
  return http({
    method: "delete",
    url,
    params,
  });
}

// Helper function to handle API errors consistently
export const handleApiError = (
  error: unknown,
  translate?: (key: string) => string,
  screen?: string
) => {
  // Check if error has the expected structure
  if (error && typeof error === "object" && "message" in error) {
    const errorData = error as { message: string; status_code?: number; success: boolean; cancelled?: boolean };
    
    // Suppress cancelled request errors (these occur during logout and are expected)
    if (errorData.cancelled || errorData.message === "Request cancelled") {
      return {
        message: errorData.message,
        status: 0,
        success: false,
      };
    }
  }

  console.error(`API Error: in ${screen}`, error);
  
  // Capture error in Sentry
  captureException(error, {
    tags: {
      screen: screen || "unknown",
      error_type: "api_error",
    },
  });

  // Import i18next for fallback translations
  let t: (key: string) => string;
  try {
    const i18next = require("i18next").default;
    t = (key: string) => {
      try {
        return i18next.t(key);
      } catch {
        return key;
      }
    };
  } catch {
    t = (key: string) => key;
  }

  // Check if error has the expected structure
  if (error && typeof error === "object" && "message" in error) {
    const errorData = error as { message: string; status_code?: number; success: boolean; cancelled?: boolean };
    
    // Handle 401 - Unauthorized (logout user)
    if (errorData.status_code === 401) {
      console.error("Unauthorized access - logging out user");
      const message = translate ? translate("common.session_expired") : t("common.session_expired");
      return {
        message,
        status: 401,
        success: false,
      };
    }

    // Show error message if available, otherwise show generic message
    const errorMessage = translate
      ? translate(errorData.message)
      : t(errorData.message) !== errorData.message
      ? t(errorData.message)
      : errorData.message || t("common.something_went_wrong");
    toastMessageError(errorMessage);

    return {
      message: errorMessage,
      status: errorData.status_code || 500,
      success: false,
    };
  }

  // Fallback for unexpected error structure
  const fallbackMessage = translate ? translate("common.something_went_wrong") : t("common.something_went_wrong");
  toastMessageError(fallbackMessage);
  return {
    message: fallbackMessage,
    status: 500,
    success: false,
  };
};

