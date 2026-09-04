import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./env";
import { healthRouter } from "./routes/health";
import { eventsRouter } from "./routes/events";
import { favoritesRouter } from "./routes/favorites";
import { authRouter } from "./routes/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { checkAndSendEmailReminders } from "./services/emailReminders";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(healthRouter);
app.use(eventsRouter);
app.use(favoritesRouter);
app.use(authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API Salão Abrasel rodando na porta ${env.PORT}`);
});

// Best-effort, igual às notificações locais do app: uma falha aqui nunca
// deve derrubar a API.
setInterval(() => {
  checkAndSendEmailReminders().catch((err) => {
    console.warn("Falha ao checar lembretes por e-mail:", err);
  });
}, 60_000);
