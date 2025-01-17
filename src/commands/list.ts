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
  if (!chatId) {
    await ctx.reply('Error: Could not determine chat ID');
    return;
  }

  let subscriptions = []
  // Create subscription
  try {
    subscriptions = await prisma.subscriptions.findMany({
      where: {
        groupId: chatId.toString()
      }
    });

    if (_.isEmpty(subscriptions)) {
      await ctx.reply('No subscriptions');
      return;
    }

    const list = subscriptions.map((sub: any) => {
      const params = []
      if (sub.to) { params.push(`${sub.to}`) }
      if (sub.from) { params.push(`from:${sub.to}`) }
      if (sub.status && sub.status != "success") { params.push(`status:${sub.status}`) }
      return `- \`${params.join(" ")}\``
    }).join('\n');

    const message = `Subscriptions:\n${list}`;
    await ctx.replyWithMarkdownV2(message, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply(`Error finding subscriptions. Please try again. ${error}`);
  }
};

export { list };