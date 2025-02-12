import _ = require('lodash');
import { prisma } from '../../prisma';
import { MyContext } from '../../types';

export const createSubscription = async ({
  ctx,
  chatId,
  topicId,
  to,
  from,
  status = 'success',
}: {
  ctx: MyContext;
  chatId: number;
  topicId?: number;
  to?: string;
  from?: string;
  status?: string;
}) => {
  const caller = 'scene' in ctx ? 'wizard' : 'command';
  const callerToErrorMessage = {
    command:
      'Please provide subscription parameters. Example: /subscribe to:bob.eth',
    wizard: 'Either "to" or "from" must be specified',
  };

  // Validate that either to or from is present
  if (!to && !from) {
    await ctx.reply(callerToErrorMessage[caller]);
    return;
  }

  // Validate status
  if (status && !['success', 'semifinal', 'final'].includes(status)) {
    await ctx.reply(
      'Invalid status. Must be one of: success, semifinal, final',
    );
    return;
  }

  const toLowerCaseOrNull = (value?: string) => value?.toLowerCase() || null;
  const toOrNull = toLowerCaseOrNull(to);
  const fromOrNull = toLowerCaseOrNull(from);

  // Create subscription
  try {
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        groupId: chatId.toString(),
        topicId: topicId?.toString(),
        from: fromOrNull,
        to: toOrNull,
        status,
      },
    });

    if (existingSubscription) {
      throw new Error('Subscription already exists');
    }

    try {
      await prisma.subscriptions.create({
        data: {
          groupId: chatId.toString(),
          topicId: topicId?.toString(),
          from: fromOrNull,
          to: toOrNull,
          status,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Subscription already exists');
      }
      throw error; // Re-throw other errors to be caught by outer try-catch
    }

    const message = getSuccessMessage(status, to, from);
    await ctx.reply(message);
  } catch (error) {
    await ctx.reply('Error creating subscription. Please try again.');
  }
};

export const getSuccessMessage = (
  status: string,
  to: string | null = null,
  from: string | null = null,
) => {
  const subscriptionDetails = _.compact([
    to ? `TO: ${to}` : '',
    from ? `FROM: ${from}` : '',
    `STATUS: ${status}`,
  ]).join('\n');

  return `✅ Subscription created\n\n${subscriptionDetails}\n\nTo see all your subscriptions: /list`;
};
