# Warehouse Productivity Backend

A production-ready REST API for tracking warehouse productivity metrics, built with Express.js, TypeScript, and MySQL.

## Features

- User authentication with JWT (access + refresh tokens)
- Role-based access control
- Daily productivity logging
- Activity tracking
- Performance metrics and reporting
- Work schedule management
- Target setting and tracking
- Swagger API documentation

## Tech Stack

- Node.js ≥ 18
- Express.js ≥ 4
- TypeScript
- Prisma ORM (MySQL)
- Zod (validation)
- JWT (authentication)
- Swagger/OpenAPI 3.1
- Docker + docker-compose

## Prerequisites

- Node.js ≥ 18
- Docker and docker-compose
- MySQL 8.0 (if running locally)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd warehouse-productivity-be
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development environment:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. The API will be available at:
   - API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api-docs

## Development

- Run in development mode:
  ```bash
  npm run dev
  ```

- Run tests:
  ```bash
  npm test
  ```

- Lint code:
  ```bash
  npm run lint
  ```

- Format code:
  ```bash
  npm run format
  ```

## API Documentation

The API documentation is available at `/api-docs` when the server is running. It provides:

- Interactive API testing
- Request/response schemas
- Authentication requirements
- Example requests

## Database Schema

The database schema is defined in `prisma/schema.prisma`. Key models include:

- User & Role management
- Daily productivity logs
- Activity tracking
- Work schedules
- Performance targets
- Report requests

## Testing

The project uses Vitest for testing. Run tests with:

```bash
npm test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

[MIT License](LICENSE) 