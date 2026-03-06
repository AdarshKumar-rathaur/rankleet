/**
 * Client Environment Configuration Validator
 * Validates required environment variables for the client
 */

const validateClientEnv = () => {
  const requiredEnv = {
    VITE_API_URL: "API base URL",
  };

  const warnings = [];

  // Check required variables
  for (const [key, description] of Object.entries(requiredEnv)) {
    const value = import.meta.env[key];
    if (!value) {
      console.error(
        `❌ Missing environment variable: ${key}\n` +
        `   Description: ${description}\n` +
        `   Please create .env.local file with required variables.\n` +
        `   See .env.example for reference.`
      );
      throw new Error(`Required environment variable missing: ${key}`);
    }

    // Validate API URL format
    if (key === "VITE_API_URL" && !isValidUrl(value)) {
      console.error(`❌ Invalid API URL: ${value}`);
      throw new Error(`Invalid VITE_API_URL format`);
    }
  }

  // Warn about optional variables
  if (!import.meta.env.VITE_FRONTEND_URL) {
    warnings.push("VITE_FRONTEND_URL not set - using window.location.origin");
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Client Environment Warnings:");
    warnings.forEach(warn => console.warn(`  • ${warn}`));
  }

  console.log("✅ Client Environment Configuration Valid");
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export { validateClientEnv, isValidUrl };
