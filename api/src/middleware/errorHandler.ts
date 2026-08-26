import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Payload inválido", details: err.flatten() });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
};
