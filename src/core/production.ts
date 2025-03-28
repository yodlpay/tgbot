import { VercelRequest, VercelResponse } from '@vercel/node';
import createDebug from 'debug';
import { Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { MyContext } from '../types';

const debug = createDebug('bot:dev');

const PORT = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000;
const WEBHOOK_URL = `${process.env.WEBHOOK_URL}`;

const production = async (
  req: VercelRequest,
  res: VercelResponse,
  bot: Telegraf<MyContext>,
) => {
  debug('Bot runs in production mode');
  debug(`setting webhook: ${WEBHOOK_URL}`);

  if (!WEBHOOK_URL) {
    throw new Error('WEBHOOK_URL is not set.');
  }

  const getWebhookInfo = await bot.telegram.getWebhookInfo();
  if (getWebhookInfo.url !== WEBHOOK_URL + '/api') {
    debug(`deleting webhook ${WEBHOOK_URL}`);
    await bot.telegram.deleteWebhook();
    debug(`setting webhook: ${WEBHOOK_URL}/api`);
    await bot.telegram.setWebhook(`${WEBHOOK_URL}/api`);
  }

  if (req.method === 'POST') {
    await bot.handleUpdate(req.body as unknown as Update, res);
  } else {
    res.status(200).json('Listening to bot events...');
  }
  debug(`starting webhook on port: ${PORT}`);
};
export { production };
