/**
 * Environment Variable Configuration
 *
 * This module loads environment variables from .env file
 * and provides typed access to them throughout the application.
 */

interface EnvVariables {
	// API Configuration
	BASE_URL: string;

	APP_VERSION: string;

	// Sentry Configuration
	SENTRY_DSN: string;

	// Environment
	NODE_ENV: string;
	APP_ENV: string;

	// Debug Configuration
	DEBUG: boolean;
	LOG_LEVEL: string;

	// API Timeout
	API_TIMEOUT: number;

	// Feature Flags
	ENABLE_LOGGING: boolean;
	ENABLE_ANALYTICS: boolean;
}

// Access environment variables
// For React Native, we'll use a simple approach with direct values
// In production, you can use react-native-config or similar
const getEnvVars = (): EnvVariables => {
	// Try to get from process.env (works with react-native-config if installed)
	// Otherwise, use direct values or fallback
	const getEnv = (key: string, defaultValue: string = ""): string => {
		// @ts-ignore - process.env may not be typed
		return process.env[key] || defaultValue;
	};

	return {
		// API Configuration
		BASE_URL: getEnv("BASE_URL", ""),

		APP_VERSION: getEnv("APP_VERSION", "1.0.0"),

		// Sentry Configuration - Load from .env file
		// This will be set via react-native-config or similar
		SENTRY_DSN: getEnv("SENTRY_DSN", "https://45b871f53abd34e1490c189cb0815d72@o4510429285711872.ingest.us.sentry.io/4510430761582592"),

		// Environment
		NODE_ENV: getEnv("NODE_ENV", __DEV__ ? "development" : "production"),
		APP_ENV: getEnv("APP_ENV", getEnv("NODE_ENV", __DEV__ ? "development" : "production")),

		// Debug Configuration
		DEBUG: getEnv("DEBUG", __DEV__ ? "true" : "false") === "true" || __DEV__,
		LOG_LEVEL: getEnv("LOG_LEVEL", "info"),

		// API Timeout
		API_TIMEOUT: parseInt(getEnv("API_TIMEOUT", "30000"), 10),

		// Feature Flags
		ENABLE_LOGGING: getEnv("ENABLE_LOGGING", "false") === "true",
		ENABLE_ANALYTICS: getEnv("ENABLE_ANALYTICS", "false") === "true",
	};
};

// Create and export the environment configuration
export const env: EnvVariables = getEnvVars();

export default env;

