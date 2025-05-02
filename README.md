# Lending Portal

A modern lending portal built with Next.js, TypeScript, and Prisma. This platform enables efficient management of loan requests, user roles, and document processing.

## Features

- User Authentication & Authorization
- Role-based Access Control
- Team Management with Invitation System
- Document Management
- Loan Request Processing
- Real-time Updates
- Responsive Design

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- Prisma (Database ORM)
- Tailwind CSS
- NextAuth.js
- React Hook Form
- Zod Validation

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn
- PostgreSQL database

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Next Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Gmail
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-specific-password"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd lending-portal
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/              # Next.js 13 app directory
├── components/       # Reusable React components
├── lib/             # Utility functions and configurations
├── types/           # TypeScript type definitions
└── prisma/          # Database schema and migrations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 