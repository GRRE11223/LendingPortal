# Lending Portal

A private lending portal built with Next.js, Supabase, and TypeScript.

## Features

- User Management (Brokers, Agents)
- Email Invitations
- Document Management
- Loan Request Processing

## Prerequisites

- Node.js 18+
- npm or yarn
- Gmail account for sending emails
- Supabase account

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gmail Configuration
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_specific_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, create a `.env.production` file with the same variables but using production values.

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd lending-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables as described above.

4. Run the development server:
```bash
npm run dev
```

## Database Schema

The application uses the following database schema:

### User
- id (String, @id)
- email (String)
- name (String)
- password (String, optional)
- role (String)
- createdAt (DateTime)
- updatedAt (DateTime)
- status (String)

### Agent
- id (String, @id)
- userId (String)
- brokerId (String)
- status (String)
- createdAt (DateTime)
- updatedAt (DateTime)
- email (String)
- name (String)
- invitationSentAt (DateTime, optional)
- invitationToken (String)

### Broker
- id (String, @id)
- name (String)
- email (String)
- phone (String, optional)
- address (String, optional)
- website (String, optional)
- status (String)
- createdAt (DateTime)
- updatedAt (DateTime)

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Gmail Setup

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security
   - 2-Step Verification
   - App Passwords
   - Generate a new app password for "Mail"
3. Use this password in your environment variables

## Security Notes

- All invitation tokens are securely generated and stored in the database
- Invitation links expire after 24 hours
- Passwords are hashed before storage
- Environment variables are properly handled for different environments

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 