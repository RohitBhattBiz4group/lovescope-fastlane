/**
 * Sentry Configuration for LoveScope App
 * This file sets up Sentry for error tracking and performance monitoring.
 */

import { Platform } from "react-native";

import env from "./env";

import * as Sentry from "@sentry/react-native";
import { CaptureContext } from "@sentry/types";

/**
 * Initialize Sentry with proper configuration
 * This should be called once at app startup
 */
export const initSentry = () => {
	Sentry.init({
		// Use DSN from environment variables
		dsn: env.SENTRY_DSN,

		// Enable debug only in development
		debug: env.DEBUG,

		// Set environment from environment variables
		environment: env.APP_ENV,

		// Enable automatic instrumentation for app performance monitoring
		// This includes React Native gestures, navigation, network requests, etc.
		enableAutoPerformanceTracing: true,

		// Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
		// In production, you may want to adjust this to a lower value.
		tracesSampleRate: __DEV__ ? 1.0 : 0.2,

		// Track HTTP errors automatically
		// Network tracking is enabled by default in React Native Sentry

		// Capture errors from Redux (if you use it)
		integrations: [
			// Add any custom integrations here
		],

		// Capture React component info
		enableNativeFramesTracking: true,

		// Send your app version to Sentry for better tracking
		release: "love-scope-app@1.0.0", // Should match version in package.json

		// Identify the user's operating system - using a fixed format for now
		// React Native platform info will be automatically captured by Sentry
		dist: Platform.OS === "ios" ? "ios" : "android",

		// Add user interaction breadcrumbs
		enableUserInteractionTracing: true,

		// Ensure sensitive data isn't sent to Sentry
		beforeSend(event, hint) {
			// Filter out null events
			if (!event) {
				return null;
			}

			// Filter out expected user cancellation errors (don't send to Sentry)
			if (hint?.originalException) {
				const error = hint.originalException as any;
				// Google Sign-In cancellation errors
				if (
					error?.code === "SIGN_IN_CANCELLED" ||
					error?.code === "getTokens" ||
					error?.message?.includes("getTokens requires a user to be signed in") ||
					error?.message?.includes("SIGN_IN_CANCELLED")
				) {
					return null; // Don't send cancellation errors to Sentry
				}
			}

			// Remove sensitive data if needed
			// For example, you can scrub authentication tokens
			if (event.request && event.request.headers) {
				delete event.request.headers.Authorization;
			}
			return event;
		},
	});
};

/**
 * Capture an exception with optional extra information
 * @param error The error to capture
 * @param context Additional context information
 */
export const captureException = (error: any, context?: CaptureContext) => {
	Sentry.captureException(error, context);
};

/**
 * Set user information for better error context
 * Call this after user login
 * @param user User information object
 */
export const setUser = (user: {
	id: string;
	email?: string;
	username?: string;
	has_completed_onboarding?: boolean;
}) => {
	Sentry.setUser(user);
};

/**
 * Clear user information
 * Call this after user logout
 */
export const clearUser = () => {
	Sentry.setUser(null);
};

/**
 * Add a breadcrumb to track user actions
 * Useful for debugging complex flows like authentication
 */
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
	Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Monitor performance for a specific operation
 * @param name Name of the operation being monitored
 * @param operation Type of operation (e.g., 'http', 'db', 'ui.render')
 * @param callback Function to execute and monitor
 */
export const monitorPerformance = async <T>(
	name: string,
	operation: string,
	callback: () => Promise<T>
): Promise<T> => {
	// Record start time
	const startTime = Date.now();

	// Add start breadcrumb
	Sentry.addBreadcrumb({
		category: "performance",
		message: `Starting ${operation}: ${name}`,
		level: "info",
	});

	try {
		// Execute the operation
		const result = await callback();

		// Record successful completion
		const duration = Date.now() - startTime;
		Sentry.addBreadcrumb({
			category: "performance",
			message: `Completed ${operation}: ${name} (${duration}ms)`,
			level: "info",
			data: { durationMs: duration },
		});

		return result;
	} catch (error) {
		// Record error with performance context
		const duration = Date.now() - startTime;
		Sentry.withScope(scope => {
			scope.setTag("operation", operation);
			scope.setExtra("duration_ms", duration);
			scope.setExtra("operation_name", name);
			Sentry.captureException(error);
		});
		throw error;
	}
};

/**
 * Set performance data to monitor specific metrics
 * @param name Metric name
 * @param value Metric value
 * @param unit Optional unit type
 */
export const setMeasurement = (name: string, value: number, unit?: string) => {
	Sentry.addBreadcrumb({
		category: "performance",
		message: `${name}: ${value}${unit ? " " + unit : ""}`,
		level: "info",
	});
};

/**
 * Custom wrapper to capture API errors with better context
 * Particularly useful for capturing authentication-related issues
 */
export const captureApiError = (
	error: any,
	apiInfo: { endpoint: string; method: string; params?: any }
) => {
	Sentry.withScope(scope => {
		scope.setTag("type", "api_error");
		scope.setExtra("api_endpoint", apiInfo.endpoint);
		scope.setExtra("api_method", apiInfo.method);
		if (apiInfo.params) {
			// Sanitize any sensitive information before logging
			const sanitizedParams = { ...apiInfo.params };
			if (sanitizedParams.password) sanitizedParams.password = "[REDACTED]";
			if (sanitizedParams.otp) sanitizedParams.otp = "[REDACTED]";
			scope.setExtra("api_params", sanitizedParams);
		}
		Sentry.captureException(error);
	});
};




