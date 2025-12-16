// CommonJS version of Prisma client
const { PrismaClient } = require('@prisma/client')

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections during hot reload
const globalForPrisma = global

// Create a new PrismaClient if one doesn't exist or use the existing one
let prisma
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient()
}
prisma = globalForPrisma.prisma

module.exports = prisma 