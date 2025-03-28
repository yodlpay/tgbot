import createDebug from 'debug';
import { subscribe } from './subscribe';
import { menu } from './menu';

const debug = createDebug('bot:start_command');

export const start = () => async (ctx: any) => {
  const { payload } = ctx;

  if (payload?.startsWith('subscribe_')) {
    const base64Ens = payload.replace('subscribe_', '');
    const ensOrAddress = atob(base64Ens);
    ctx.message.text = `/subscribe ${ensOrAddress}`;
    return subscribe()(ctx);
  } else {
    return menu()(ctx);
  }
};
