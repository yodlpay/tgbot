import { Scenes } from 'telegraf';
import { createSubscription } from './helpers';
import { MyContext } from '../../types';

const skipButton = { text: '⏭️ Skip', callback_data: 'skip' };
const abortButton = { text: '🚫 Abort', callback_data: 'abort' };

const STATUS_OPTIONS = ['success', 'semifinal', 'final'] as const;

const statusKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Success', callback_data: 'success' },
        { text: 'Semifinal', callback_data: 'semifinal' },
        { text: 'Final', callback_data: 'final' },
      ],
      [abortButton],
    ],
  },
};

const defaultKeyboard = {
  reply_markup: {
    inline_keyboard: [[skipButton, abortButton]],
  },
};

const handleClickAbort = async (ctx: MyContext, action: string) => {
  if (action === 'abort') {
    await ctx.reply('Subscription cancelled');
    return ctx.scene.leave();
  }
};

const handleAddressInput = async (ctx: MyContext, field: 'to' | 'from') => {
  if (ctx.callbackQuery) {
    // @ts-ignore
    const action = ctx.callbackQuery.data as string;
    await ctx.answerCbQuery();

    await handleClickAbort(ctx, action);

    if (action === 'skip') {
      ctx.scene.session.subscribeData[field] = undefined;
    }
  } else if (ctx.message && 'text' in ctx.message) {
    const value = ctx.message.text.trim();
    ctx.scene.session.subscribeData[field] = value;
  }
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
    await handleAddressInput(ctx, 'to');

    await ctx.reply(
      'Enter an ENS name or address to subscribe FROM:',
      defaultKeyboard,
    );
    return ctx.wizard.next();
  },
  // Step 3: Handle 'from' and ask for 'status'
  async (ctx) => {
    await handleAddressInput(ctx, 'from');

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

    await handleClickAbort(ctx, action);

    if (!STATUS_OPTIONS.includes(action as any)) {
      await ctx.reply('Invalid status. Please select one of the options above');
      return;
    }

    ctx.scene.session.subscribeData.status = action;

    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        throw new Error('Could not determine chat ID');
      }

      const { to, from, status = 'success' } = ctx.scene.session.subscribeData;
      console.log('Creating subscription with:', { chatId, to, from, status });

      await createSubscription({
        chatId,
        topicId: ctx.message?.message_thread_id,
        to,
        from,
        status,
        caller: 'wizard',
      });

      const subscriptionDetails = [
        to ? `TO: ${to}` : '',
        from ? `FROM: ${from}` : '',
        `STATUS: ${status}`,
      ]
        .filter(Boolean)
        .join('\n');

      await ctx.reply(
        `✅ Subscription created:\n${subscriptionDetails}\n\nTo see all your subscriptions: /list`,
      );
    } catch (error: any) {
      console.error('Subscription error:', error);
      await ctx.reply(
        error.message || '🔴 Error creating subscription. Please try again.',
      );
    }

    return ctx.scene.leave();
  },
);
