export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Requested resource was not found.'
  });
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || (String(err.message || '').startsWith('CORS blocked') ? 403 : 500);
  const isSafeClientError =
    statusCode >= 400 && statusCode < 500 && !String(err.message || '').startsWith('CORS blocked');
  const message = isSafeClientError ? err.message : 'Unable to process the request right now.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};
