/**
 * Request Body Validation Middleware
 * Validates request payloads and ensures data types/formats
 */

const validateRequestBody = (req, res, next) => {
  try {
    // Skip validation for GET and DELETE requests (they don't have bodies)
    if (req.method === "GET" || req.method === "DELETE") {
      return next();
    }

    // Check if request has body for POST/PUT/PATCH
    // FIX: We skip this check if the user is joining a group via URL
    const isJoinRoute = req.originalUrl && req.originalUrl.includes("/join/");

    if (!isJoinRoute && (!req.body || Object.keys(req.body).length === 0)) {
      return res.status(400).json({ message: "Request body is empty" });
    }

    // Ensure body is an object
    if (typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "Request body must be a JSON object" });
    }

    // Limit object keys to prevent abuse
    const keys = Object.keys(req.body);
    if (keys.length > 50) {
      return res.status(400).json({ message: "Request has too many fields" });
    }

    // Validate string fields aren't excessively long
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string" && value.length > 10000) {
        return res.status(400).json({ message: `Field '${key}' is too long (max 10000 chars)` });
      }

      // Check for suspicious patterns
      if (typeof value === "string") {
        // Basic NoSQL injection prevention
        if (/[\$\{\}]/.test(value) && process.env.NODE_ENV === "production") {
          return res.status(400).json({ message: `Field '${key}' contains invalid characters` });
        }
      }
    }

    next();
  } catch (error) {
    console.error("Validation middleware error:", error.message);
    res.status(400).json({ message: "Invalid request format" });
  }
};

module.exports = validateRequestBody;
