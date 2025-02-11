import { prisma } from '../../prisma';

export const createSubscription = async ({
  chatId,
  topicId,
  to,
  from = null,
  status = 'success',
}: {
  chatId: number;
  topicId?: number;
  to?: string;
  from?: string | null;
  status?: string;
}) => {
  // Validate that either to or from is present
  if (!to && !from) {
    throw new Error('Either "to" or "from" must be specified');
  }

  // Validate status
  if (status && !['success', 'semifinal', 'final'].includes(status)) {
    throw new Error(
      'Invalid status. Must be one of: success, semifinal, final',
    );
  }

  // Check for existing subscription
  const existingSubscription = await prisma.subscriptions.findFirst({
    where: {
      groupId: chatId.toString(),
      topicId: topicId ? topicId.toString() : null,
      from,
      to: to?.toLowerCase(),
      status,
    },
  });

  if (existingSubscription) {
    throw new Error('Subscription already exists');
  }

  // Create subscription
  return await prisma.subscriptions.create({
    data: {
      groupId: chatId.toString(),
      topicId: topicId?.toString(),
      from,
      to: to?.toLowerCase(),
      status,
    },
  });
};
