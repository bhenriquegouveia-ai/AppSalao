import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/ApiError";
import { requireAppKey } from "../middleware/apiKey";
import { favoriteBodySchema } from "../schemas/favorite";

export const favoritesRouter = Router();

favoritesRouter.post(
  "/favorites",
  requireAppKey,
  asyncHandler(async (req, res) => {
    const { device_id, event_id } = favoriteBodySchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: event_id } });
    if (!event) {
      throw ApiError.notFound("Evento não encontrado");
    }

    const favorite = await prisma.userFavorite.upsert({
      where: { deviceId_eventId: { deviceId: device_id, eventId: event_id } },
      update: {},
      create: { deviceId: device_id, eventId: event_id },
    });

    res.status(201).json(favorite);
  })
);

favoritesRouter.delete(
  "/favorites",
  requireAppKey,
  asyncHandler(async (req, res) => {
    const { device_id, event_id } = favoriteBodySchema.parse(req.body);

    await prisma.userFavorite
      .delete({
        where: { deviceId_eventId: { deviceId: device_id, eventId: event_id } },
      })
      .catch(() => {
        // Já não existia — remoção é idempotente do ponto de vista do cliente.
      });

    res.status(204).send();
  })
);

favoritesRouter.get(
  "/favorites/:device_id",
  requireAppKey,
  asyncHandler(async (req, res) => {
    const favorites = await prisma.userFavorite.findMany({
      where: { deviceId: req.params.device_id },
      include: { event: true },
      orderBy: { event: { startTime: "asc" } },
    });

    res.json(favorites.map((f) => f.event));
  })
);
