const { PrismaClient } = require('@prisma/client')
const bcryptjs = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample users
  const hashedPassword = await bcryptjs.hash('Demo@123', 10)

  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      username: 'johndoe',
      password: hashedPassword,
      displayName: 'John Doe',
      role: 'client',
      isActive: true,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      username: 'janesmith',
      password: hashedPassword,
      displayName: 'Jane Smith',
      role: 'client',
      isActive: true,
    },
  })

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@busticket.com' },
    update: {},
    create: {
      email: 'admin@busticket.com',
      username: 'admin',
      password: hashedPassword,
      displayName: 'System Administrator',
      role: 'admin',
      isActive: true,
    },
  })

  // Create sample operator
  const operator = await prisma.operator.create({
    data: {
      name: 'Green Bus Lines',
      contact_email: 'contact@greenbus.com',
      contact_phone: '+1555000111',
      status: 'approved',
      approved_at: new Date(),
    },
  })

  // Create sample route
  const route = await prisma.route.create({
    data: {
      operator_id: operator.id,
      origin: 'Ho Chi Minh City',
      destination: 'Da Lat',
      distance_km: 300,
      estimated_minutes: 360,
    },
  })

  // Create sample bus
  const bus = await prisma.bus.upsert({
    where: { plate_number: 'GBL-001' },
    update: {},
    create: {
      operator_id: operator.id,
      plate_number: 'GBL-001',
      model: 'Mercedes Sprinter',
      seat_capacity: 16,
      amenities_json: JSON.stringify(['WiFi', 'AC', 'Reclining Seats', 'Reading Lights']),
    },
  })

  // Create seats for the bus
  const seatNumbers = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4']

  for (const seatNumber of seatNumbers) {
    await prisma.seat.upsert({
      where: {
        bus_id_seat_number: {
          bus_id: bus.id,
          seat_number: seatNumber,
        },
      },
      update: {},
      create: {
        bus_id: bus.id,
        seat_number: seatNumber,
        seat_type: seatNumber.startsWith('A') ? 'premium' : 'regular',
        is_active: true,
      },
    })
  }

  // Create sample trip
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(8, 0, 0, 0) // 8:00 AM

  const arrivalTime = new Date(tomorrow)
  arrivalTime.setHours(14, 0, 0, 0) // 2:00 PM

  const trip = await prisma.trip.create({
    data: {
      route_id: route.id,
      bus_id: bus.id,
      departure_time: tomorrow,
      arrival_time: arrivalTime,
      base_price: 250000, // 250,000 VND
      status: 'scheduled',
    },
  })

  // Create seat statuses for the trip
  const seats = await prisma.seat.findMany({
    where: { bus_id: bus.id },
  })

  for (const seat of seats) {
    await prisma.seatStatus.upsert({
      where: {
        trip_id_seat_id: {
          trip_id: trip.id,
          seat_id: seat.id,
        },
      },
      update: {},
      create: {
        trip_id: trip.id,
        seat_id: seat.id,
        status: 'available',
      },
    })
  }

  // Create sample payment method
  await prisma.paymentMethod.create({
    data: {
      user_id: user1.id,
      provider: 'stripe',
      token: 'card_1234567890abcdef',
      is_default: true,
    },
  })

  console.log('✅ Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
