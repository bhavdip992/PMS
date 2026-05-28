import { Request, Response, NextFunction } from 'express';

const clean = (obj: Record<string, any>): void => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          clean(obj[key]);
        }
      }
    }
  }
};

export const mongoSanitize = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) clean(req.body);
  if (req.query) clean(req.query as Record<string, any>);
  if (req.params) clean(req.params);
  next();
};
