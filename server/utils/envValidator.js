/**
 * Environment Configuration Validator
 * Validates all required environment variables on application startup
 */

const validateEnv = () => {
  const requiredEnv = {
    MONGO_URI: "MongoDB connection string",
    JWT_SECRET: "JWT signing secret",
    NODE_ENV: "Node environment (development/production)",
  };

  const optionalEnv = {
    PORT: "Server port (default: 5000)",
    CLIENT_URL: "Client URL for CORS",
    SERVER_URL: "Server URL for health checks",
  };

  const missing = [];
  const invalid = [];

  // Check required variables
  for (const [key, description] of Object.entries(requiredEnv)) {
    if (!process.env[key]) {
      missing.push(`${key}: ${description}`);
    }
  }

  // Validate specific values
  if (process.env.NODE_ENV && !["development", "production", "test"].includes(process.env.NODE_ENV)) {
    invalid.push("NODE_ENV must be one of: development, production, test");
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 12) {
    invalid.push("JWT_SECRET must be at least 12 characters (32+ recommended for production)");
  }

  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    invalid.push("PORT must be a valid number");
  }

  if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith("mongodb")) {
    invalid.push("MONGO_URI must be a valid MongoDB connection string");
  }

  // Report errors
  if (missing.length > 0 || invalid.length > 0) {
    console.error("\n❌ Environment Configuration Error\n");

    if (missing.length > 0) {
      console.error("Missing required environment variables:");
      missing.forEach(msg => console.error(`  • ${msg}`));
    }

    if (invalid.length > 0) {
      console.error("\nInvalid environment variables:");
      invalid.forEach(msg => console.error(`  • ${msg}`));
    }

    console.error("\nPlease create a .env file and configure the required variables.");
    console.error("See .env.example for reference.\n");
    process.exit(1);
  }

  // Warn about optional variables in production
  if (process.env.NODE_ENV === "production") {
    const warnings = [];
    if (!process.env.CLIENT_URL) {
      warnings.push("CLIENT_URL not set - CORS may not work correctly");
    }
    if (!process.env.SERVER_URL) {
      warnings.push("SERVER_URL not set - Health check cron job disabled");
    }

    if (warnings.length > 0) {
      console.warn("\n⚠️  Production Warnings:");
      warnings.forEach(warn => console.warn(`  • ${warn}`));
      console.warn();
    }
  }

  // Log valid configuration summary (without sensitive data)
  console.log("\n✅ Environment Configuration Valid");
  console.log(`  Environment: ${process.env.NODE_ENV}`);
  console.log(`  Port: ${process.env.PORT || 5000}`);
  console.log(`  Database: ${process.env.MONGO_URI ? "✓ Connected" : "✗ Not configured"}`);
  console.log(`  JWT Secret: ${process.env.JWT_SECRET ? "✓ Set" : "✗ Not set"}`);
  console.log();
};

module.exports = validateEnv;
