import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:about_command');

const about = () => async (ctx: Context) => {
  const message = `Yodl bot notifies when a payment happens.

  To subscribe to a payment, use the following command:
  \`\`\`/subscribe <to>\`\`\`

  To unsubscribe from a payment, use the following command:
  \`\`\`/unsubscribe <to>\`\`\`

  To list all subscriptions, use the following command:
  \`\`\`/list\`\`\`
  `;

  await ctx.replyWithMarkdownV2(message, { parse_mode: 'Markdown' });
};

export { about };
