import { AppError } from '../utils/http.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[source]);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return next(new AppError(`Validation failed: ${issue.path.join('.') || issue.message}`, 400));
  }

  req[source] = parsed.data;
  return next();
};
