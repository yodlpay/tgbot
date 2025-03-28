import { Context } from 'telegraf';
import _ = require('lodash');
import { prisma } from '../../prisma';

export const unsubscribe = () => async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const topicId = ctx.message?.message_thread_id?.toString();

  if (!chatId) {
    await ctx.reply('Error: Could not determine chat ID');
    return;
  }

  // @ts-ignore
  const text = ctx.message?.text?.toLowerCase();
  const args = text.split(' ').slice(1);
  const params = args.join(' ');

  if (_.isEmpty(args)) {
    await ctx.reply('Please provide parameters. Example: /unsubscribe bob.eth');
    return;
  }

  let toMatch;
  if (args[0]?.includes(':')) {
    toMatch = params.match(/to:([^\s]+)/)?.[1];
  } else {
    toMatch = args[0];
  }

  try {
    if (toMatch === 'all') {
      await prisma.subscriptions.deleteMany({
        where: {
          groupId: chatId.toString(),
          topicId: topicId || null,
        },
      });
      await ctx.reply('All subscriptions deleted');
    } else {
      await prisma.subscriptions.deleteMany({
        where: {
          groupId: chatId.toString(),
          topicId: topicId || null,
          to: toMatch,
        },
      });
      await ctx.reply('Subscription deleted');
    }
  } catch (error: any) {
    await ctx.reply('Error deleting subscription. Please try again.');
  }
};
