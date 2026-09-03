import { RequestHandler } from "express";
import { verifyToken } from "../lib/auth";
import { ApiError } from "../lib/ApiError";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    throw ApiError.unauthorized("Token de autenticação ausente");
  }

  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch {
    throw ApiError.unauthorized("Token de autenticação inválido ou expirado");
  }
};
