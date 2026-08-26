import { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 não propaga rejeições de Promise para o error handler sozinho —
// este wrapper evita repetir try/catch em cada rota async.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
