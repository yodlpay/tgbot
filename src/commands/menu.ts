import { Context } from 'telegraf';
import createDebug from 'debug';
import { list } from './list';
import { MyContext } from '../types';

const debug = createDebug('bot:about_command');

const menu = () => async (ctx: Context) => {
  const message = 'Manage your subscriptions';
  const keyboard = {
    inline_keyboard: [
      [{ text: '🔔 Subscribe', callback_data: 'menu_subscribe' }],
      [{ text: '🔕 Unsubscribe', callback_data: 'menu_unsubscribe' }],
      [{ text: '📋 List subscriptions', callback_data: 'menu_list' }],
    ],
  };

  await ctx.reply(message, {
    reply_markup: keyboard,
  });
};

const handleMenuCallbacks = () => async (ctx: MyContext) => {
  // @ts-ignore
  const action = ctx.callbackQuery.data;
  await ctx.answerCbQuery();

  switch (action) {
    case 'menu_subscribe':
      return await ctx.scene.enter('subscribe-wizard');
    case 'menu_unsubscribe':
      return await ctx.scene.enter('unsubscribe-wizard');
    case 'menu_list':
      return list()(ctx);
  }
};

export { menu, handleMenuCallbacks };
