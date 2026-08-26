# Salão Abrasel — App

Monorepo com o app mobile (Expo/React Native) e a API (Node/Express/Prisma/MySQL) do app de agenda do Salão Abrasel.

```
/app   → Expo (React Native + TypeScript) — app mobile
/api   → Node + Express + TypeScript + Prisma — API própria
```

## 1. API (`/api`)

### 1.1 Configurar ambiente

```bash
cd api
cp .env.example .env
```

Edite `.env`:
- `DATABASE_URL`: string de conexão MySQL (Railway ou local).
- `APP_API_KEY`: chave que o app mobile vai usar (header `x-api-key`).
- `ADMIN_API_KEY`: chave separada para as rotas administrativas (header `x-admin-key`), usada para cadastrar/editar/remover eventos sem mexer direto no banco.

### 1.2 Instalar, migrar e popular com dados mock

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

O seed cria eventos **fictícios** (prefixados com `[MOCK]`) só para desenvolvimento. Os eventos reais devem ser cadastrados via `POST /events` (rota admin) ou diretamente no banco.

### 1.3 Rodar em desenvolvimento

```bash
npm run dev
```

API sobe em `http://localhost:3333` (ou a porta definida em `PORT`). Teste com:

```bash
curl http://localhost:3333/health
curl http://localhost:3333/events -H "x-api-key: SUA_APP_API_KEY"
```

### 1.4 Endpoints

| Método | Rota                    | Auth        | Descrição                                  |
|--------|--------------------------|-------------|---------------------------------------------|
| GET    | `/health`                | —           | Healthcheck                                  |
| GET    | `/events`                | `x-api-key` | Lista eventos (`?date=YYYY-MM-DD&category=`) |
| GET    | `/events/:id`            | `x-api-key` | Detalhe de um evento                         |
| POST   | `/favorites`             | `x-api-key` | `{ device_id, event_id }`                    |
| DELETE | `/favorites`             | `x-api-key` | `{ device_id, event_id }`                    |
| GET    | `/favorites/:device_id`  | `x-api-key` | Eventos favoritados por um device            |
| POST   | `/events`                | `x-admin-key` | Cria evento                                |
| PUT    | `/events/:id`            | `x-admin-key` | Edita evento                               |
| DELETE | `/events/:id`            | `x-admin-key` | Remove evento                              |

### 1.5 Deploy (Railway) — passo manual

Não incluído automaticamente nesta sessão (requer login na sua conta):

1. Crie um projeto no [Railway](https://railway.app), adicione um plugin MySQL.
2. Adicione um serviço apontando para a pasta `/api` deste repositório (deploy via GitHub) ou rode `railway up` a partir de `/api` com o Railway CLI já logado.
3. Configure as variáveis de ambiente do serviço (`DATABASE_URL` já vem pronta do plugin MySQL; adicione `APP_API_KEY` e `ADMIN_API_KEY`).
4. Rode a migration em produção: `railway run npx prisma migrate deploy`.

## 2. App mobile (`/app`)

### 2.1 Configurar ambiente

```bash
cd app
cp .env.example .env
```

Edite `.env`:
- `EXPO_PUBLIC_API_BASE_URL`: URL da API (em dev, use o IP da sua máquina na rede local se for testar em device físico — `localhost` só funciona em emulador/simulador).
- `EXPO_PUBLIC_API_KEY`: mesma chave configurada em `APP_API_KEY` na API.

### 2.2 Rodar em desenvolvimento

```bash
npm install
npx expo start
```

Abra no Expo Go (Android/iOS) ou em um emulador.

### 2.3 Build de produção (EAS) — passo manual

Requer login (`eas login`) na sua conta Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

## 3. Pendências / próximos passos

- **Planta do local**: o mapa usa um placeholder ilustrativo (`src/features/map/PlantaPlaceholder.tsx`). Assim que a planta real (PNG/SVG) for enviada, trocar por um `<Image>` do mesmo componente.
- **Identidade visual Abrasel**: `src/constants/theme.ts` usa uma paleta neutra placeholder. Trocar pelas cores/logo oficiais quando fornecidos.
- **Dados reais dos eventos**: cadastrar via `POST /events` (rota admin) — o seed é só mock de desenvolvimento.
- **Deploy Railway e build EAS**: passos manuais descritos acima (exigem login nas suas contas).
