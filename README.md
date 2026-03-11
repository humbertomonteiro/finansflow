# 💸 FinansFlow

> Controle financeiro pessoal moderno — gerencie receitas, despesas, metas e performance com uma interface limpa e responsiva.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)

---

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Páginas](#páginas)
- [Roadmap](#roadmap)

---

## Sobre

FinansFlow é uma aplicação web de finanças pessoais construída com **Next.js 15**, **TypeScript** e **Firebase**. Permite que o usuário registre receitas e despesas, acompanhe métricas mensais, visualize gráficos de desempenho e defina metas de gastos por categoria.

O projeto segue os princípios de **Clean Architecture**: entidades de domínio, casos de uso, controllers e repositórios são separados e independentes da camada de UI.

---

## Funcionalidades

### ✅ Implementadas

| Funcionalidade | Descrição |
|---|---|
| Autenticação | Login e registro via Firebase Auth |
| Transações simples | Receita ou despesa avulsa |
| Transações parceladas | Divide automaticamente em N parcelas mensais |
| Transações fixas | Recorrência mensal sem data final |
| Marcar como pago/recebido | Atualiza saldo atual em tempo real |
| Editar transação | Altera descrição, valor e categoria |
| Remover transação | Com escopo: apenas esta, desta em diante, ou todas |
| Dashboard | Cards de saldo, receitas, despesas, balanço e projeção |
| Gráfico anual | Evolução mensal de receitas/despesas/balanço |
| Gráfico por categoria | Pizza com distribuição de gastos |
| Performance | Análise detalhada com status e recomendações |
| Filtros de transações | Todas, receitas, despesas, pagas, não pagas |
| Busca por nome | Campo de pesquisa nas transações |
| Configurações | Gerenciamento de contas e categorias |
| Metas | Limite de gasto mensal por categoria com barra de progresso |
| Navegação por mês | Setas para avançar/recuar no período |

---

## Tecnologias

- **[Next.js 15](https://nextjs.org/)** — Framework React com App Router
- **[TypeScript](https://www.typescriptlang.org/)** — Tipagem estática
- **[Firebase](https://firebase.google.com/)** — Autenticação (Auth) + Banco de dados (Firestore)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Estilização utilitária
- **[Recharts](https://recharts.org/)** — Gráficos
- **[date-fns](https://date-fns.org/)** — Manipulação de datas
- **[react-icons](https://react-icons.github.io/react-icons/)** — Ícones

---

## Arquitetura

O projeto utiliza **Clean Architecture** adaptada para frontend:

```
src/
├── domain/           # Núcleo da aplicação (independente de framework)
│   ├── entities/     # Entidades com regras de negócio (User, Account, Transaction, Category)
│   ├── usecases/     # Casos de uso (CreateTransaction, MetricsUsecase...)
│   ├── interfaces/   # Contratos (ITransaction, IAccount...)
│   └── enums/        # Enumerações (TransactionKind, TransactionTypes...)
│
├── infra/            # Implementações externas
│   ├── repositories/ # Firebase (Firestore)
│   └── services/     # Configuração do Firebase
│
├── controllers/      # Orquestram usecases + repositórios
│
├── app/              # Camada de UI (Next.js App Router)
│   ├── (auth)/       # Páginas públicas (login, registro)
│   ├── (pages)/      # Páginas protegidas (dashboard, transactions...)
│   ├── components/   # Componentes React reutilizáveis
│   ├── contexts/     # UserContext — estado global
│   └── hooks/        # useUser
│
├── constants/        # Categorias padrão
├── errors/           # Classes de erro por domínio
└── utils/            # Utilitários (generateUID, dateUtils)
```

### Fluxo de dados

```
UI Component
  → Controller (orquestra)
    → UseCase (regra de negócio)
      → Repository (Firebase/InMemory)
  ← Controller retorna entidade tipada
← Context atualiza estado global
```

---

## Instalação

### Pré-requisitos

- Node.js >= 18
- npm, yarn ou pnpm
- Projeto Firebase configurado (Firestore + Authentication)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/humbertomonteiro/finansflow.git
cd finansflow

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (veja a seção abaixo)
cp .env.example .env.local

# 4. Execute em modo desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu projeto Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

> ⚠️ Nunca comite o `.env.local` no repositório. Ele já está no `.gitignore`.

---

## Estrutura de Pastas

```
finansflow/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (pages)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── performance/page.tsx
│   │   │   ├── goals/page.tsx          ← Nova
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   └── template/
│   │   ├── contexts/UserContext.tsx
│   │   ├── hooks/useUser.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── constants/
│   ├── controllers/
│   ├── domain/
│   ├── errors/
│   ├── infra/
│   └── utils/
├── middleware.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Páginas

### `/dashboard`
Visão geral do mês: saldo atual, receitas, despesas, balanço e projeção acumulada. Inclui gráfico anual e listas de transações próximas e atrasadas.

### `/transactions`
Lista completa de transações do mês com filtros (todas, receitas, despesas, pagas, não pagas) e busca por nome.

### `/performance`
Análise detalhada: porcentagem de despesas sobre receitas, resumo por categoria com gráfico de pizza, e gráfico de linha anual.

### `/goals`
Defina limites mensais de gasto por categoria. Barras de progresso mostram visualmente quanto já foi consumido de cada meta. Alertas automáticos ao atingir 80% ou ultrapassar o limite.

### `/settings`
- **Contas**: crie (até 3) e remova contas bancárias
- **Categorias**: crie (até 20) e remova categorias personalizadas
- **Perfil**: edite seu nome de exibição
- **Sair**: logout seguro

---

## Roadmap

- [ ] Exportar transações como CSV/PDF
- [ ] Ajuste manual de saldo de conta
- [ ] Tela de "Começar do zero" (reset de dados)
- [ ] Suporte a múltiplas moedas
- [ ] Notificações de vencimento
- [ ] PWA (Progressive Web App) — instalável no celular

---

## Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.

---

Feito com ❤️ por [Humberto Monteiro](https://github.com/humbertomonteiro)
