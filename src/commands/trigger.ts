import { Context } from 'telegraf';
import createDebug from 'debug';
import { prisma } from '../prisma';
import { handleTransaction } from '..';

const debug = createDebug('bot:trigger_command');

/***
 * Examples:
 * /trigger 0x0
 *
 * @returns
 */

const trigger = () => async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    return;
  }

  // @ts-ignore
  const text = ctx.message?.text?.toLowerCase();
  const args = text.split(' ').slice(1);

  const txHash = args[0];

  if (!txHash) {
    await ctx.reply('Please provide txHash. Example: /trigger 0x0');
    return;
  }
  try {
    await handleTransaction(txHash);
    await ctx.reply('Transaction triggered');
  } catch (error) {
    await ctx.reply('Error triggering transaction. Please try again.');
  }
};

export { trigger };
