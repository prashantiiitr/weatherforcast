// lightweight request logger for prod/debug
export function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const line = `${req.method} ${req.originalUrl} → ${res.statusCode} ${ms}ms`;
    // only basic logging; avoid dumping bodies with secrets
    if (process.env.NODE_ENV !== 'test') console.info(line);
  });
  next();
}
