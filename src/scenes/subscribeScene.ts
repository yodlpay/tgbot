import { Scenes } from 'telegraf';
import { subscribe } from '../commands/subscribe';
import { BotContext } from '../types';

const subscribeScene = new Scenes.WizardScene<BotContext>(
  'subscribe-wizard',
  async (ctx) => {
    await ctx.reply('Please enter the address you want to subscribe to:');
    return ctx.wizard.next();
  },
  async (ctx) => {
    const address = ctx.message?.text;
    if (!address) {
      await ctx.reply('Please provide a valid address');
      return;
    }

    await ctx.scene.leave();
    return await subscribe()(ctx);
  },
);

export { subscribeScene };
