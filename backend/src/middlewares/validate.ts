import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../utils/app-error";

/**
 * Validates req.body, req.params, and req.query against the provided Zod schema.
 * Validated (and coerced/defaulted) values are written back to req.body, req.params,
 * and stored in res.locals.query (since req.query is a read-only getter in Express 5).
 */
export const validate = (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      return next(new AppError(400, "Validation failed", "VALIDATION_ERROR", result.error.flatten()));
    }
    const value = result.data as { body?: unknown; params?: unknown; query?: unknown };
    if (value.body !== undefined) req.body = value.body;
    if (value.params !== undefined) req.params = value.params as Request["params"];
    // Express 5: req.query is a read-only getter. Store validated query in res.locals.query
    // so route handlers can access coerced/defaulted values via res.locals.query
    if (value.query !== undefined) res.locals.query = value.query;
    next();
  };
