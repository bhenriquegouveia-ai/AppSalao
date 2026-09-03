import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dados fictícios apenas para desenvolvimento. Os eventos reais do Salão
// Abrasel devem ser cadastrados depois via endpoints admin.
const MOCK_EVENTS = [
  {
    title: "[MOCK] Abertura oficial do Salão Abrasel",
    description:
      "Cerimônia de abertura com boas-vindas e apresentação da programação do evento.",
    speaker: "Diretoria Abrasel",
    locationName: "Auditório Principal",
    locationMapX: 0.5,
    locationMapY: 0.15,
    startTime: new Date("2026-09-15T12:00:00-03:00"),
    endTime: new Date("2026-09-15T12:45:00-03:00"),
    category: "cerimonia",
  },
  {
    title: "[MOCK] Tendências de delivery para bares e restaurantes",
    description:
      "Palestra sobre o cenário atual de delivery no setor de food service e oportunidades para 2027.",
    speaker: "Ana Paula Ribeiro",
    locationName: "Sala 1",
    locationMapX: 0.25,
    locationMapY: 0.4,
    startTime: new Date("2026-09-15T13:30:00-03:00"),
    endTime: new Date("2026-09-15T14:30:00-03:00"),
    category: "palestra",
  },
  {
    title: "[MOCK] Workshop: Gestão de custos em cozinha profissional",
    description:
      "Workshop prático sobre precificação de cardápio, ficha técnica e controle de CMV.",
    speaker: "Carlos Menezes",
    locationName: "Sala 2",
    locationMapX: 0.75,
    locationMapY: 0.4,
    startTime: new Date("2026-09-15T15:00:00-03:00"),
    endTime: new Date("2026-09-15T16:30:00-03:00"),
    category: "workshop",
  },
  {
    title: "[MOCK] Networking com fornecedores parceiros",
    description:
      "Espaço de relacionamento entre expositores, fornecedores e associados Abrasel.",
    speaker: null,
    locationName: "Área de Convivência",
    locationMapX: 0.5,
    locationMapY: 0.7,
    startTime: new Date("2026-09-15T17:00:00-03:00"),
    endTime: new Date("2026-09-15T18:30:00-03:00"),
    category: "networking",
  },
  {
    title: "[MOCK] IA aplicada à gestão de restaurantes",
    description:
      "Painel com cases reais de uso de inteligência artificial na operação de bares e restaurantes.",
    speaker: "Fernanda Costa e João Alves",
    locationName: "Auditório Principal",
    locationMapX: 0.5,
    locationMapY: 0.15,
    startTime: new Date("2026-09-16T10:00:00-03:00"),
    endTime: new Date("2026-09-16T11:15:00-03:00"),
    category: "palestra",
  },
  {
    title: "[MOCK] Encerramento e sorteio de brindes",
    description: "Encerramento oficial do segundo dia do evento com sorteio entre os participantes.",
    speaker: "Diretoria Abrasel",
    locationName: "Auditório Principal",
    locationMapX: 0.5,
    locationMapY: 0.15,
    startTime: new Date("2026-09-16T18:00:00-03:00"),
    endTime: new Date("2026-09-16T18:30:00-03:00"),
    category: "cerimonia",
  },
];

async function main() {
  console.log("Seeding banco com dados MOCK de desenvolvimento...");

  for (const event of MOCK_EVENTS) {
    await prisma.event.create({ data: event });
  }

  console.log(`${MOCK_EVENTS.length} eventos mock criados.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
