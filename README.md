# IMAGO Search

A lightweight, production-oriented search and analytics platform built on Next.js. Implements full-text keyword search, multi-dimensional filtering, and advanced analytics — all without external dependencies.

**Author:** Andrii Shaposhnikov ([@MagisterUnivers](https://github.com/MagisterUnivers))

---

## Project Structure

```
.
├── web/              # Next.js 14 search frontend + API
│   ├── app/          # Pages and API routes
│   ├── components/   # React components
│   ├── lib/          # Utilities, search logic, preprocessing
│   ├── types/        # TypeScript definitions
│   └── docs/         # Architecture & design documentation
├── docker-compose.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

```bash
# Install dependencies
cd web
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
cd web
npm run build
npm run start
```

### Docker

```bash
npm run docker:run
```

---

## Documentation

- **[Web Documentation](./web/docs/README.md)** — Overview, design decisions, API reference
- **[Architecture](./web/docs/Architecture.md)** — Technical architecture, scaling strategy, trade-offs

---

## Key Features

- **Full-text Search** — Sub-millisecond keyword search with relevance scoring
- **Smart Filtering** — Multi-dimensional filtering by photographers, restrictions, dates, and more
- **Analytics** — Track search queries and user interactions
- **Zero External Dependencies** — No database, no search engine — everything runs in-process

---

## License

MIT
