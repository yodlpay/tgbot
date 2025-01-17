import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:about_command');

const unsubscribe = () => async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const message = `Add following option to your yodl config:\n\`\`\`json\n{\n  ...\n  "webhooks" : ["https://tg.yodl.me/v1/tx?id=${chatId}"]\n}\n\`\`\``;

  debug(`Triggered "about" command with message \n${message}`);
  await ctx.replyWithMarkdownV2(message, { parse_mode: 'Markdown' });
};

export { unsubscribe };
