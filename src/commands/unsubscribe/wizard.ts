import { Scenes } from 'telegraf';
import { MyContext } from '../../types';
import { prisma } from '../../prisma';

const abortButton = { text: '🚫 Abort', callback_data: 'abort' };
const allButton = { text: '🗑️ Delete All', callback_data: 'all' };

export const unsubscribeWizard = new Scenes.WizardScene<MyContext>(
  'unsubscribe-wizard',
  // Step 1: Show options
  async (ctx) => {
    const subscriptions = await prisma.subscriptions.findMany({
      where: {
        groupId: ctx.chat?.id.toString(),
        topicId: ctx.message?.message_thread_id?.toString() || null,
      },
    });

    if (subscriptions.length === 0) {
      await ctx.reply('No active subscriptions found.');
      return ctx.scene.leave();
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          ...subscriptions.map((sub) => [
            {
              text: `🔕 ${sub.to || sub.from}`,
              callback_data: sub.to || sub.from || '',
            },
          ]),
          [allButton],
          [abortButton],
        ],
      },
    };

    await ctx.reply('Select subscription to delete:', keyboard);
    return ctx.wizard.next();
  },
  // Step 2: Handle selection
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('Please select one of the options above');
      return;
    }

    // @ts-ignore
    const action = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (action === 'abort') {
      await ctx.reply('Operation cancelled');
      return ctx.scene.leave();
    }

    if (action === 'all') {
      const count = await prisma.subscriptions.count({
        where: {
          groupId: ctx.chat?.id.toString(),
          topicId: ctx.message?.message_thread_id?.toString() || null,
        },
      });

      const confirmKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Yes, delete all', callback_data: 'confirm_all' },
              { text: '❌ No, cancel', callback_data: 'abort' },
            ],
          ],
        },
      };

      await ctx.reply(
        `Are you sure you want to delete all ${count} subscriptions?`,
        confirmKeyboard,
      );
      return ctx.wizard.next();
    }

    try {
      await prisma.subscriptions.deleteMany({
        where: {
          groupId: ctx.chat?.id.toString(),
          topicId: ctx.message?.message_thread_id?.toString() || null,
          to: action,
        },
      });
      await ctx.reply(`Subscription to ${action} deleted`);
    } catch (error) {
      await ctx.reply('Error deleting subscription. Please try again.');
    }

    return ctx.scene.leave();
  },
  // Step 3: Handle confirmation for delete all
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('Please select one of the options above');
      return;
    }

    // @ts-ignore
    const action = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (action === 'abort') {
      await ctx.reply('Operation cancelled');
      return ctx.scene.leave();
    }

    if (action === 'confirm_all') {
      try {
        await prisma.subscriptions.deleteMany({
          where: {
            groupId: ctx.chat?.id.toString(),
            topicId: ctx.message?.message_thread_id?.toString() || null,
          },
        });
        await ctx.reply('All subscriptions deleted');
      } catch (error) {
        await ctx.reply('Error deleting subscriptions. Please try again.');
      }
    }

    return ctx.scene.leave();
  },
);
