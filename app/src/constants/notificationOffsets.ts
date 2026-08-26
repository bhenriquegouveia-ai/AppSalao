// Intervalos antes do início do evento em que uma notificação local deve
// disparar. Ajuste livremente — cada favorito agenda uma notificação por
// offset (offsets cujo horário já passou são simplesmente ignorados).
export const NOTIFICATION_OFFSETS_MINUTES = [
  { minutesBefore: 24 * 60, label: "Amanhã tem" },
  { minutesBefore: 60, label: "Daqui a 1 hora" },
  { minutesBefore: 15, label: "Daqui a 15 minutos" },
];
