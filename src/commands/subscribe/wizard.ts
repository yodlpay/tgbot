import { Scenes } from 'telegraf';
import { createSubscription } from './helpers';
import { MyContext } from '../../types';

const skipButton = { text: '⏭️ Skip', callback_data: 'skip' };
const cancelButton = { text: '🚫 Cancel', callback_data: 'cancel' };

const STATUS_OPTIONS = ['success', 'semifinal', 'final'] as const;

const statusKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Success', callback_data: 'success' },
        { text: 'Semifinal', callback_data: 'semifinal' },
        { text: 'Final', callback_data: 'final' },
      ],
      [cancelButton],
    ],
  },
};

const defaultKeyboard = {
  reply_markup: {
    inline_keyboard: [[skipButton, cancelButton]],
  },
};

const handleClickCancel = async (ctx: MyContext) => {
  await ctx.reply('Operation cancelled');
  return ctx.scene.leave();
};

const handleAddressInput = async (ctx: MyContext, field: 'to' | 'from') => {
  if (ctx.callbackQuery) {
    // @ts-ignore
    const action = ctx.callbackQuery.data as string;
    await ctx.answerCbQuery();

    if (action === 'cancel') {
      await handleClickCancel(ctx);
      return true;
    }

    if (action === 'skip') {
      ctx.scene.session.subscribeData[field] = undefined;
    }
  } else if (ctx.message && 'text' in ctx.message) {
    const value = ctx.message.text.trim();
    ctx.scene.session.subscribeData[field] = value;
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
  // Step 2: Handle 'to' and ask for 'from'
  async (ctx) => {
    const cancelled = await handleAddressInput(ctx, 'to');
    if (cancelled) return;

    await ctx.reply(
      'Enter an ENS name or address to subscribe FROM:',
      defaultKeyboard,
    );
    return ctx.wizard.next();
  },
  // Step 3: Handle 'from' and ask for 'status'
  async (ctx) => {
    const cancelled = await handleAddressInput(ctx, 'from');
    if (cancelled) return;

    const { to, from } = ctx.scene.session.subscribeData;
    if (!to && !from) {
      await ctx.reply(
        "You must specify either TO or FROM address. Let's start over.",
      );
      return ctx.scene.leave();
    }

    await ctx.reply('Select status:', statusKeyboard);
    return ctx.wizard.next();
  },
  // Step 4: Handle 'status' and create subscription
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('Please select one of the options above');
      return;
    }

    // @ts-ignore
    const action = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (action === 'cancel') {
      await handleClickCancel(ctx);
      return;
    }

    if (!STATUS_OPTIONS.includes(action as any)) {
      await ctx.reply('Invalid status. Please select one of the options above');
      return;
    }

    // Initialize subscribeData if it doesn't exist
    if (!ctx.scene.session.subscribeData) {
      ctx.scene.session.subscribeData = {};
    }

    ctx.scene.session.subscribeData.status = action;

    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error('Could not determine chat ID');
    }

    const { to, from, status = 'success' } = ctx.scene.session.subscribeData;

    await createSubscription({
      ctx,
      chatId,
      topicId: ctx.message?.message_thread_id,
      to,
      from,
      status,
    });

    return ctx.scene.leave();
  },
);
