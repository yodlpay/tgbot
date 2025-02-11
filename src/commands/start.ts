import { about } from './about';
import createDebug from 'debug';
import { subscribe } from './subscribe/index';

const debug = createDebug('bot:start_command');

export const start = () => async (ctx: any) => {
  const { payload } = ctx;
  if (!payload) return;

  if (payload.startsWith('subscribe_')) {
    const base64Ens = payload.replace('subscribe_', '');
    const ensOrAddress = atob(base64Ens);
    ctx.message.text = `/subscribe ${ensOrAddress}`;
    return subscribe()(ctx);
  } else if (payload.startsWith('about')) {
    return about()(ctx);
  } else {
    ctx.reply('Unknown command');
  }
};
