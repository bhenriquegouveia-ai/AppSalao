// Identidade visual oficial do Salão Abrasel 2026 (Brand Guidelines).
// Fontes da marca (Noka / Alfabet) ainda não foram fornecidas — usamos peso
// e caixa-alta do sistema pra aproximar o estilo "display" até termos os
// arquivos de fonte reais (ver TYPOGRAPHY abaixo).
export const colors = {
  // Paleta bruta da marca
  creme: "#F7F1EC",
  marinho: "#15243C",
  rosa: "#EA5E81",
  laranja: "#F19447",
  limao: "#D1DB62",
  azulClaro: "#C9D8F0",

  // Tokens semânticos usados pelos componentes
  primary: "#EA5E81", // Rosa — acento primário, CTAs
  secondary: "#F19447", // Laranja — acento secundário, calor
  background: "#F7F1EC", // Creme — fundo principal
  surface: "#FFFFFF", // cards "LIGHT" — branco sobre creme
  surfaceCream: "#F7F1EC", // cards "CREAM" — flat, seções neutras
  text: "#15243C", // Marinho — texto sobre fundo claro
  textOnDark: "#F7F1EC", // Creme — texto sobre fundo escuro/gradiente
  textMuted: "#5B6B80", // navy suave, derivado do Marinho
  border: "#E7DFD3", // neutro suave sobre creme

  live: "#EA5E81", // Rosa — vívido, chama atenção ("AO VIVO")
  ended: "#9AA0A6",
};

export const gradients = {
  // "Cinematográfico" — hero, painéis cheios, warm glow
  cinematic: ["#0E1930", "#15243C", "#3A2436"] as const,
  // "Espectro" — sublinhado de headline / divisor. Nunca usar como fundo de área grande.
  spectrum: ["#EA5E81", "#F19447", "#D1DB62"] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Cantos retos por padrão nas superfícies (cards); "pill" é reservado pra
// chips/botões/badges; "circle" pra avatares.
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
};

// Aproximação da hierarquia tipográfica do guia enquanto não temos as fontes
// reais (Noka Black pro display, Alfabet pro texto). display* = uppercase +
// tracking largo + peso pesado, imitando o estilo "Noka" com fonte do sistema.
export const typography = {
  display: {
    textTransform: "uppercase" as const,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },
  label: {
    textTransform: "uppercase" as const,
    fontWeight: "700" as const,
    letterSpacing: 1,
    fontSize: 11,
  },
};
