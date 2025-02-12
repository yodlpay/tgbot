import { Context } from 'telegraf';
import createDebug from 'debug';
import { prisma } from '../prisma';
import _ = require('lodash');

const debug = createDebug('bot:list_command');

/***
 * Examples:
 *
 * /list
 *
 * @returns
 */

const list = () => async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const topicId = ctx.message?.message_thread_id;

  if (!chatId) {
    await ctx.reply('Error: Could not determine chat ID');
    return;
  }

  let subscriptions = [];
  // Create subscription
  try {
    subscriptions = await prisma.subscriptions.findMany({
      where: {
        groupId: chatId.toString(),
        topicId: topicId ? topicId.toString() : null,
      },
    });

    if (_.isEmpty(subscriptions)) {
      await ctx.reply('No subscriptions');
      return;
    }

    const toSubs = subscriptions
      .filter((sub) => sub.to)
      .map((sub) => sub.to)
      .filter((addr): addr is string => !!addr)
      .map((addr) => `\`${addr}\``);

    const fromSubs = subscriptions
      .filter((sub) => sub.from)
      .map((sub) => sub.from)
      .filter((addr): addr is string => !!addr)
      .map((addr) => `\`${addr}\``);

    const message = [
      `*Subscriptions*\n\n`,
      toSubs.length ? `*To:*\n${toSubs.join('\n')}\n\n` : '',
      fromSubs.length ? `*From:*\n${fromSubs.join('\n')}\n\n` : '',
    ]
      .filter(Boolean)
      .join('');

    await ctx.replyWithMarkdownV2(message.replace(/\./g, '\\.'));
  } catch (error) {
    await ctx.reply(`Error finding subscriptions. Please try again. ${error}`);
  }
};

export { list };
