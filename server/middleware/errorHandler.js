const errorHandler = (err, req, res, next) => {
  console.error("[ERROR]", err.message);
  
  // Don't expose sensitive error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : "Internal Server Error";
  
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({ 
    message,
    ...(isDevelopment && { stack: err.stack })
  });
};
module.exports = errorHandler;
