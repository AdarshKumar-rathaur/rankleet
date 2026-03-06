/**
 * Response Format Standardization Utility
 * Ensures all API responses follow a consistent format
 */

/**
 * Standard Success Response Format
 */
const successResponse = (data, message = "Success", statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Standard Error Response Format
 */
const errorResponse = (message, statusCode = 500, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Pagination Response Format
 */
const paginatedResponse = (data, page, limit, total) => {
  return {
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
