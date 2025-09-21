# SeatBook - Auditorium Seat Booking System

A modern Next.js-based seat booking system for a single auditorium with interactive seat selection and show management.

## Features

- **Interactive Seat Selection**: Visual seating chart with real-time availability
- **Multiple Seat Types**: VIP, Premium, and Regular seating options
- **Show Management**: Browse upcoming shows and events
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **User Authentication**: Secure login and registration system
- **Booking Management**: Track and manage seat reservations

## Technology Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js (planned)
- **Icons**: Lucide React

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd auditorium-booking
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── shows/
│   │   └── page.tsx          # Shows listing
│   └── booking/
│       └── [id]/
│           └── page.tsx      # Interactive seat booking
├── components/               # Reusable UI components (planned)
└── lib/                     # Utilities and configurations (planned)

prisma/
└── schema.prisma            # Database schema
```

## Database Schema

The application uses the following main entities:

- **Users**: Customer accounts and admin users
- **Auditorium**: Single auditorium configuration
- **Seats**: Individual seat definitions with types and pricing
- **Shows**: Events and performances
- **SeatBookings**: Seat reservations for specific shows

## Development

You can start editing the application by modifying the files in the `src/app` directory. The application auto-updates as you edit files.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
