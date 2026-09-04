import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  PORT: z.coerce.number().default(3333),
  APP_API_KEY: z.string().min(1, "APP_API_KEY é obrigatório"),
  ADMIN_API_KEY: z.string().min(1, "ADMIN_API_KEY é obrigatório"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter pelo menos 16 caracteres"),
  // Opcionais: sem RESEND_API_KEY, os lembretes por e-mail simplesmente não
  // rodam (best-effort, igual às notificações locais — nunca derruba a API).
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Salão Abrasel <onboarding@resend.dev>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
