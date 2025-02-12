import { Scenes } from 'telegraf';
import { createSubscription } from './helpers';
import { MyContext } from '../../types';

const cancelButton = { text: '🚫 Cancel', callback_data: 'cancel' };

const defaultKeyboard = {
  reply_markup: {
    inline_keyboard: [[cancelButton]],
  },
};

const handleClickCancel = async (ctx: MyContext) => {
  await ctx.reply('Operation cancelled');
  return ctx.scene.leave();
};

const handleAddressInput = async (ctx: MyContext) => {
  if (ctx.callbackQuery) {
    // @ts-ignore
    const action = ctx.callbackQuery.data as string;
    await ctx.answerCbQuery();

    if (action === 'cancel') {
      await handleClickCancel(ctx);
      return true;
    }

    if (action === 'skip') {
      ctx.scene.session.subscribeData.to = undefined;
    }
  } else if (ctx.message && 'text' in ctx.message) {
    const value = ctx.message.text.trim();
    ctx.scene.session.subscribeData.to = value;
  }
  return false;
};

export const subscribeWizard = new Scenes.WizardScene<MyContext>(
  'subscribe-wizard',
  // Step 1: Ask for 'to' address
  async (ctx) => {
    await ctx.reply(
      'Enter an ENS name or address to subscribe TO:',
      defaultKeyboard,
    );
    ctx.scene.session.subscribeData = {};
    return ctx.wizard.next();
  },
  // Step 2: Handle 'to' and create subscription
  async (ctx) => {
    const cancelled = await handleAddressInput(ctx);
    if (cancelled) return;

    const { to } = ctx.scene.session.subscribeData;
    if (!to) {
      await ctx.reply("You must specify a TO address. Let's start over.");
      return ctx.scene.leave();
    }

    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error('Could not determine chat ID');
    }

    await createSubscription({
      ctx,
      chatId,
      topicId: ctx.message?.message_thread_id,
      to,
      from: undefined,
      status: 'success',
    });

    return ctx.scene.leave();
  },
);
