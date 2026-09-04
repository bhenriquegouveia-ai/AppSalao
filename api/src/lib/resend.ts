import { Resend } from "resend";
import { env } from "../env";

// Sem RESEND_API_KEY configurada, os lembretes por e-mail ficam desligados
// (best-effort, igual às notificações locais do app — nunca derruba a API).
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
