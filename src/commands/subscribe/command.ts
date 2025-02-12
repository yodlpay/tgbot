import { createSubscription } from './helpers';
import { MyContext } from '../../types';

export const subscribe = () => async (ctx: MyContext) => {
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

  if (!params) {
    await ctx.reply(
      'Please provide subscription parameters. Example: /subscribe to:bob.eth',
    );
    return;
  }

  let toMatch;
  if (args[0]?.includes(':')) {
    toMatch = params.match(/to:([^\s]+)/)?.[1];
  } else {
    toMatch = args[0];
  }

  // Parse parameter
  const fromMatch = params.match(/from:([^\s]+)/);
  const statusMatch = params.match(/status:([^\s]+)/);

  // If no explicit parameters are provided, treat the entire params as 'to'
  const to = toMatch;
  const from = fromMatch ? fromMatch[1] : null;
  const status = statusMatch ? statusMatch[1] : 'success';

  await createSubscription({
    ctx,
    chatId,
    topicId,
    to,
    from,
    status,
  });
};
