import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./env";
import { healthRouter } from "./routes/health";
import { eventsRouter } from "./routes/events";
import { favoritesRouter } from "./routes/favorites";
import { authRouter } from "./routes/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

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
