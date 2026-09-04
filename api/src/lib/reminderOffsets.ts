// Mesmos intervalos usados nas notificações locais do app
// (app/src/constants/notificationOffsets.ts) — mantenha os dois em sincronia.
export const REMINDER_OFFSETS_MINUTES = [
  { minutesBefore: 24 * 60, label: "Amanhã tem" },
  { minutesBefore: 60, label: "Daqui a 1 hora" },
  { minutesBefore: 15, label: "Daqui a 15 minutos" },
];

// Se o servidor ficar fora do ar e perder o instante exato de um aviso, ainda
// dá pra mandar com atraso dentro dessa janela; passado isso, esse aviso em
// específico é considerado perdido (não manda mais tarde, fora de contexto).
export const CATCH_UP_WINDOW_MINUTES = 5;
