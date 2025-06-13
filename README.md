# Modern CRM System

A modern Customer Relationship Management (CRM) system built with Next.js, Node.js, and PostgreSQL.

## Features

- Dark mode interface
- User management (CRUD)
- Customer management (CRUD)
- Payment tracking
- Responsive design
- Secure authentication

## Tech Stack

### Frontend

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/ui
- React Query
- Zustand

### Backend

- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Project Structure

```
mycrm/
├── frontend/           # Next.js frontend application
├── backend/           # Node.js backend application
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables with your configuration

4. Start the development servers:

   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm run dev
   ```

## License

MIT
