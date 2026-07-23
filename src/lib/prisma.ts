import { PrismaClient } from '../generated/prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
