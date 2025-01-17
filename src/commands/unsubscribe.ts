import { Context } from 'telegraf';
import createDebug from 'debug';
import _ = require('lodash');
import { prisma } from '../prisma';

const debug = createDebug('bot:about_command');

const unsubscribe = () => async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const topicId = ctx.message?.message_thread_id?.toString();

  if (!chatId) {
    await ctx.reply('Error: Could not determine chat ID');
    return;
  }

  // @ts-ignore
  const text = ctx.message?.text?.toLowerCase();
  const args = text.split(' ').slice(1);
  const params = args.join(' '); // Get everything after /subscribe

  if (_.isEmpty(args)) {
    await ctx.reply('Please provide parameters. Example: /unsubscribe bob.eth');
    return;
  }

  let toMatch;
  if (args[0]?.includes(':')) {
    toMatch = params.match(/to:([^\s]+)/)[1];
  } else {
    toMatch = args[0];
  }

  if (toMatch == 'all') {
    await prisma.subscriptions.deleteMany({
      where: {
        groupId: chatId.toString(),
        topicId: topicId ? topicId.toString() : null,
      },
    });
  } else {
    await prisma.subscriptions.deleteMany({
      where: {
        groupId: chatId.toString(),
        topicId: topicId ? topicId.toString() : null,
        to: toMatch,
      },
    });

    const message = `Subscription deleted`;
    await ctx.reply(message);
  }
};

export { unsubscribe };
