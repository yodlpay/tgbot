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

    // TODOD: truncate if address.
    const list = subscriptions
      .map((sub: any) => {
        const to = sub.to || '-';
        const from = sub.from || '-';
        const status = sub.status || '-';
        return `\`${to.padEnd(15)} ${from.padEnd(15)} ${status.padEnd(10)}\``;
      })
      .join('\n');

    const header = `\`${'To'.padEnd(15)} ${'From'.padEnd(15)} ${'Status'.padEnd(10)}\`\n`;
    const message = `Subscriptions:\n${header}${list}`;
    await ctx.replyWithMarkdownV2(message, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply(`Error finding subscriptions. Please try again. ${error}`);
  }
};

export { list };
