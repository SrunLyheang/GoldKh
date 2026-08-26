# GoldKh

Personal gold price tracking dashboard — log buy/sell transactions, watch live gold prices, and see portfolio value over time.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19
- [Clerk](https://clerk.com) for authentication
- [Neon](https://neon.tech) (Postgres) + [Drizzle ORM](https://orm.drizzle.team)
- Tailwind CSS 4
- Vitest + Testing Library

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your own keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Lint the codebase |
| `npm run test` | Run the test suite |
| `npm run test:watch` | Run tests in watch mode |

## Project docs

See [`context/`](context) for product scope, architecture, UI conventions, and coding standards, and [`docs/`](docs) for agent workflow docs.
