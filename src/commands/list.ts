import { Context } from 'telegraf';
import createDebug from 'debug';
import { prisma } from '../prisma';

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

    const list = subscriptions.map((sub: any) => `\`to:${sub.to}\``).join('\n');

    const message = `Subscriptions: ${list}`;
    await ctx.reply(message);
  } catch (error) {
    await ctx.reply('Error creating subscription. Please try again.');
  }
};

export { list };