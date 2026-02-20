# Bus Ticket Booking API - Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration if needed. Default values:
```env
DATABASE_URL=postgresql://demo:demo123@localhost:5432/bus_ticket_db
LOCAL_DEV_APP_HOST=localhost
LOCAL_DEV_APP_PORT=8017
BUILD_MODE=dev
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## Database Setup

### 1. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This will start a PostgreSQL container with:
- **Host**: localhost
- **Port**: 5432
- **Database**: bus_ticket_db
- **User**: demo
- **Password**: demo123

### 2. Check PostgreSQL is running

```bash
docker-compose ps
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

This will create all the necessary tables in your PostgreSQL database.

## Development

### Start the development server

```bash
npm run dev
```

The server will start at `http://localhost:8017`

## Prisma Commands

- **Generate Prisma Client**: `npm run prisma:generate`
- **Create & Run Migration**: `npm run prisma:migrate`
- **Open Prisma Studio (DB GUI)**: `npm run prisma:studio`
- **Push Schema to DB (without migration)**: `npm run db:push`
- **Reset Database**: `npm run prisma:reset`
- **Seed Database**: `npm run prisma:seed`

## Updating Database Schema

When you modify your Prisma schema (`prisma/schema.prisma`), follow these steps:

### 1. After making changes to your models:

```bash
# Generate a new migration and apply it
npm run prisma:migrate
```

This command will:
- Compare your schema with the current database
- Create a new migration file in `prisma/migrations/`
- Apply the changes to your database
- Regenerate the Prisma client automatically

### 2. Alternative: Push changes directly (for development only)

```bash
# Push schema changes without creating a migration
npm run db:push
```

⚠️ **Note**: Use `db:push` only in development. For production, always use migrations.

### 3. If you need to regenerate the client manually:

```bash
npm run prisma:generate
```

## Sample Data

To populate your database with sample data for testing:

```bash
npm run prisma:seed
```

This will create:
- 2 sample users (john.doe@example.com, jane.smith@example.com)
- 1 bus operator (Green Bus Lines)
- 1 route (Ho Chi Minh City to Da Lat)
- 1 bus with 16 seats
- 1 scheduled trip for tomorrow
- Sample payment method

**Login credentials for testing:**
- Email: `john.doe@example.com` or `jane.smith@example.com`
- Password: `password123`

## Database Schema

The project includes a comprehensive bus ticket booking system with the following models:

### Core Entities:
- **User**: User accounts with authentication and payment methods
- **Operator**: Bus companies managing routes and buses
- **Route**: Travel routes between destinations
- **Bus**: Individual buses with seat configurations
- **Trip**: Scheduled bus trips on specific routes
- **Seat**: Bus seat configurations and availability
- **Booking**: Ticket bookings with passenger details
- **Payment**: Payment processing and transaction records
- **Notification**: System notifications for bookings and updates
- **Feedback**: User reviews and ratings for trips

### Key Features:
- Multi-operator support
- Dynamic seat management
- Payment processing integration
- Notification system
- User feedback and ratings
- Comprehensive booking workflow

## Stopping the Database

```bash
docker-compose down
```

To remove the database volume as well:
```bash
docker-compose down -v
```

## Troubleshooting

### Connection Issues

If you can't connect to the database:
1. Check if PostgreSQL is running: `docker-compose ps`
2. Check the logs: `docker-compose logs postgres`
3. Verify the DATABASE_URL in `.env` matches your configuration

### Port Already in Use

If port 5432 is already in use, you can change it in `docker-compose.yml`:
```yaml
ports:
  - '5433:5432'  # Use 5433 on host instead
```

Then update your DATABASE_URL:
```
DATABASE_URL=postgresql://demo:demo123@localhost:5433/bus_ticket_db
```

## Production Build

```bash
npm run build
npm run production
```
