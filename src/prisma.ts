import { PrismaClient } from '@prisma/client'
import _ = require('lodash');

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!
    }
  }
})

export const findByTo = async (needle: string | undefined) => {
  if (!needle || _.isEmpty(needle)) return null;

  const subscriptions = await prisma.subscriptions.findMany({
    where: {
      to: needle.toLowerCase()
    }
  });

  return subscriptions;
}

export const findByReceiver = async (ensName: string | undefined, address: string) => {
  const toParam = _.compact([address.toLowerCase(), ensName?.toLowerCase()])

  const subscriptions = await prisma.subscriptions.findMany({
    where: {
      to: { in: toParam }
    }
  });

  return subscriptions;
}

