import { Context } from 'telegraf';
import createDebug from 'debug';
import { prisma } from '../prisma';

const debug = createDebug('bot:subscribe_command');

/*** 
 * Examples: 
 * /subscribe bob.eth (equivalent to /subscribe to:bob.eth)
 * /subscribe to:bob.eth
 * /subscribe from:alice.eth status:(success|semifinal|final)
 *
 * Parameters:
 * - to: address, ensName or ensWildcard (*.yodlpay.eth)
 * - from: address, ensName or ensWildcard (*.yodlpay.eth)
 * - status: [success|semifinal|final] - defaults to success
 * 
 * @returns 
 */

const subscribe = () => async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    await ctx.reply('Error: Could not determine chat ID');
    return;
  }

  // @ts-ignore
  const text = ctx.message?.text?.toLowerCase();
  const args = text.split(' ').slice(1);
  const params = text.split(' ').slice(1).join(" "); // Get everything after /subscribe

  debug(params, text)

  if (!params) {
    await ctx.reply('Please provide subscription parameters. Example: /subscribe to:bob.eth');
    return;
  }

  let toMatch;
  if (args[0]?.includes(":")) {
    toMatch = params.match(/to:([^\s]+)/)[1];
  } else {
    toMatch = args[0]
  }

  // Parse parameter
  const fromMatch = params.match(/from:([^\s]+)/);
  const statusMatch = params.match(/status:([^\s]+)/);


  // If no explicit parameters are provided, treat the entire params as 'to'
  const to = toMatch;
  const from = fromMatch ? fromMatch[1] : null;
  const status = statusMatch ? statusMatch[1] : 'success';

  // Validate status
  if (status && !['success', 'semifinal', 'final'].includes(status)) {
    await ctx.reply('Invalid status. Must be one of: success, semifinal, final');
    return;
  }

  // Create subscription
  try {
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        groupId: chatId.toString(),
        from,
        to,
        status
      }
    })
    if (existingSubscription) {
      console.log({ existingSubscription })
      await ctx.reply('Subscription already exists');
      return;
    }

    await prisma.subscriptions.create({
      data: {
        groupId: chatId.toString(),
        from,
        to,
        status
      }
    });

    const message = `Subscription created`;
    await ctx.reply(message);
  } catch (error) {
    await ctx.reply('Error creating subscription. Please try again.');
  }
};

export { subscribe };