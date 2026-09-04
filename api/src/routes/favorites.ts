import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/ApiError";
import { requireAuth } from "../middleware/auth";
import { favoriteBodySchema } from "../schemas/favorite";
import { env } from "../env";
import { sendReminderEmail } from "../services/emailReminders";

export const favoritesRouter = Router();

favoritesRouter.post(
  "/favorites",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { event_id } = favoriteBodySchema.parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: event_id } });
    if (!event) {
      throw ApiError.notFound("Evento não encontrado");
    }

    const favorite = await prisma.userFavorite.upsert({
      where: { userId_eventId: { userId: req.userId, eventId: event_id } },
      update: {},
      create: { userId: req.userId, eventId: event_id },
    });

    // Só para testes (ver env.ts): manda o lembrete na hora, sem esperar o
    // prazo real. Não trava a resposta — se falhar, favoritar continua ok.
    if (env.DEBUG_EMAIL_ON_FAVORITE) {
      prisma.user.findUnique({ where: { id: req.userId } }).then((user) => {
        if (!user) return;
        return sendReminderEmail(user.email, "Teste (favoritado agora)", event);
      }).catch((err) => {
        console.warn("Falha ao enviar e-mail de teste ao favoritar:", err);
      });
    }

    res.status(201).json(favorite);
  })
);

favoritesRouter.delete(
  "/favorites",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { event_id } = favoriteBodySchema.parse(req.body);

    await prisma.userFavorite
      .delete({
        where: { userId_eventId: { userId: req.userId, eventId: event_id } },
      })
      .catch(() => {
        // Já não existia — remoção é idempotente do ponto de vista do cliente.
      });

    res.status(204).send();
  })
);

favoritesRouter.get(
  "/favorites",
  requireAuth,
  asyncHandler(async (req, res) => {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: req.userId },
      include: { event: true },
      orderBy: { event: { startTime: "asc" } },
    });

    res.json(favorites.map((f) => f.event));
  })
);
