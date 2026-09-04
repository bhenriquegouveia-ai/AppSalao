import { prisma } from "../lib/prisma";
import { resend } from "../lib/resend";
import { env } from "../env";
import { CATCH_UP_WINDOW_MINUTES, REMINDER_OFFSETS_MINUTES } from "../lib/reminderOffsets";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "short",
  day: "2-digit",
  month: "short",
});

type ReminderEvent = { title: string; locationName: string; startTime: Date };

export function buildReminderEmail(label: string, event: ReminderEvent) {
  const time = timeFormatter.format(event.startTime);
  const date = dateFormatter.format(event.startTime);

  return {
    subject: `${label}: ${event.title}`,
    html: `
      <p>Olá!</p>
      <p><strong>${label}</strong> começa a palestra que você favoritou:</p>
      <p style="font-size: 16px; font-weight: bold;">${event.title}</p>
      <p>${event.locationName} · ${date} às ${time}</p>
      <p style="color: #888; font-size: 12px;">Salão Abrasel 2026</p>
    `,
  };
}

// Usado tanto pela checagem periódica quanto pelo envio imediato de teste
// (DEBUG_EMAIL_ON_FAVORITE) — um único lugar decide o conteúdo do e-mail.
export async function sendReminderEmail(to: string, label: string, event: ReminderEvent): Promise<void> {
  if (!resend) return;
  const email = buildReminderEmail(label, event);
  await resend.emails.send({ from: env.EMAIL_FROM, to, subject: email.subject, html: email.html });
}

// Roda a cada minuto (ver index.ts): procura favoritos cujo evento está
// prestes a começar num dos intervalos de aviso e manda um e-mail — cada
// combinação (usuário, evento, intervalo) só é enviada uma vez, garantido
// pela constraint única de SentEmailReminder.
export async function checkAndSendEmailReminders(): Promise<void> {
  if (!resend) return; // RESEND_API_KEY não configurada — recurso desligado.

  const now = Date.now();

  const favorites = await prisma.userFavorite.findMany({
    include: { user: true, event: true },
  });

  for (const favorite of favorites) {
    const minutesUntilStart = (favorite.event.startTime.getTime() - now) / 60_000;
    if (minutesUntilStart <= 0) continue;

    for (const offset of REMINDER_OFFSETS_MINUTES) {
      const isDue =
        minutesUntilStart <= offset.minutesBefore &&
        minutesUntilStart > offset.minutesBefore - CATCH_UP_WINDOW_MINUTES;
      if (!isDue) continue;

      try {
        // "Reserva" o envio primeiro: se já existir (constraint única), o
        // create falha e pulamos — evita mandar o mesmo e-mail duas vezes.
        await prisma.sentEmailReminder.create({
          data: {
            userId: favorite.userId,
            eventId: favorite.eventId,
            minutesBefore: offset.minutesBefore,
          },
        });
      } catch {
        continue; // já enviado antes
      }

      try {
        await sendReminderEmail(favorite.user.email, offset.label, favorite.event);
      } catch (err) {
        console.warn(`Falha ao enviar lembrete por e-mail para ${favorite.user.email}:`, err);
      }
    }
  }
}
