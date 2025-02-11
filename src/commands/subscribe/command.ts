import { Context } from 'telegraf';
import { createSubscription } from './helpers';

export const subscribe = () => async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const topicId = ctx.message?.message_thread_id;

  if (!chatId) {
    await ctx.reply('Error: Could not determine chat ID');
    return;
  }

  // @ts-ignore
  const text = ctx.message?.text?.toLowerCase();
  const args = text.split(' ').slice(1);
  const params = args.join(' ');

  // Match pattern: [to:]<address> [from:<address>] [status:<status>]
  const pattern =
    /^(?:(?:to:)?([^\s]+))?\s*(?:from:([^\s]+))?\s*(?:status:([^\s]+))?$/;
  if (!params.match(pattern)) {
    await ctx.reply('Invalid command. Example: /subscribe to:bob.eth');
    return;
  }

  let toMatch;
  if (args[0]?.includes(':')) {
    toMatch = params.match(/to:([^\s]+)/)?.[1];
  } else {
    toMatch = args[0];
  }

  const fromMatch = params.match(/from:([^\s]+)/);
  const statusMatch = params.match(/status:([^\s]+)/);

  const to = toMatch;
  const from = fromMatch ? fromMatch[1] : null;
  const status = statusMatch ? statusMatch[1] : 'success';

  try {
    await createSubscription({
      chatId,
      topicId,
      to,
      from,
      status,
    });
    await ctx.reply(
      `✅ Subscription to ${to} created\n\nTo see all your subscriptions: /list`,
    );
  } catch (error: any) {
    await ctx.reply(
      error.message || 'Error creating subscription. Please try again.',
    );
  }
};
