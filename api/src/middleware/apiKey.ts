import { RequestHandler } from "express";
import { env } from "../env";
import { ApiError } from "../lib/ApiError";

// Aceita tanto a chave do app quanto a chave admin — usado nas rotas públicas
// consumidas pelo app mobile.
export const requireAppKey: RequestHandler = (req, _res, next) => {
  const key = req.header("x-api-key");

  if (key !== env.APP_API_KEY && key !== env.ADMIN_API_KEY) {
    throw ApiError.unauthorized("x-api-key inválida ou ausente");
  }

  next();
};

// Usado nas rotas administrativas (cadastro/edição/remoção de eventos).
export const requireAdminKey: RequestHandler = (req, _res, next) => {
  const key = req.header("x-admin-key");

  if (key !== env.ADMIN_API_KEY) {
    throw ApiError.unauthorized("x-admin-key inválida ou ausente");
  }

  next();
};
