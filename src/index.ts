import { Telegraf } from 'telegraf';

import { about, subscribe, trigger, unsubscribe } from './commands';
import { VercelRequest, VercelResponse } from '@vercel/node';

import { development, production } from './core';
import { Hex, verifyMessage } from 'viem';
import assert = require('assert');
import { findByReceiver, prisma } from './prisma';
import { list } from './commands/list';
import { fetchPaymentByTxHash, PaymentSimple } from './indexerClient';
import _ = require('lodash');
import { tokenlist } from '@yodlpay/tokenlists';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

bot.command('about', about());
bot.command('subscribe', subscribe());
bot.command('unsubscribe', unsubscribe());
bot.command('list', list());
bot.command('trigger', trigger());

// Currently hardcoded. Alternatively lookup address of `webhooks.yodl.eth`
const YODL_WEBHOOK_ADDRESS =
  '0x66a31Aa400dd8C11f9af054c3b7bCcB783B4901B' as Hex;

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.url && req.url.startsWith('/v1/tx') && req.method === 'POST') {
      if (!req.headers) return;
      console.log(`POST ${req.url}`);

      const signature = req.headers['x-yodl-signature'] as Hex;
      const addressShort = req.headers['x-yodl-address'] as Hex;

      assert(signature, 'Signature is required');
      assert(signature, addressShort);
      assert(
        YODL_WEBHOOK_ADDRESS.startsWith(addressShort),
        'Invalid signing address',
      );

      const isValidSignature = await verifyMessage({
        // This is buggy, should tap into raw request body instead:
        //https://medium.com/@jackoddy/reading-the-body-of-a-request-in-vercels-edge-middleware-b4dbe446eabb
        message: JSON.stringify(req.body),
        signature,
        address: YODL_WEBHOOK_ADDRESS,
      });

      if (!isValidSignature) {
        return res.status(401).send({ message: 'Invalid signature' });
      }

      await handleTransaction(req.body.txHash);
      console.log('handleTransaction done');
      // const queryString = req.url?.split('?')[1] || '';
      // const params = new URLSearchParams(queryString);
      // const groupId = params.get('id');
      // if (groupId) {
      //   await bot.telegram.sendMessage(groupId, `payment arrived https://yodl.me/tx/${req.body.txHash}`);
      // }
      // curl "https://yodl-tg.vercel.app/v1/tx?id=-1002437707079" -X POST -d '{"txHash":"0xd873efc81150f79c4eb68033341f09640bb1259db68aece385002dab6ce3bc37","chainId":100}' -H "Content-Type: application/json"
      res.status(200).send('OK');
      console.log('res status set to 200');
    } else {
      // telegram webhooks:
      await production(req, res, bot);
    }
  } catch (error) {
    console.log('error happened', error);
    await prisma.$disconnect();
  }
};

export async function handleTransaction(txHash: Hex) {
  console.log(`handleTransaction ${txHash}`);
  const { payment } = await fetchPaymentByTxHash(txHash);
  const { receiverAddress, receiverEnsPrimaryName } = payment;

  if (isSpam(payment)) {
    console.log('Rejected spam payment', payment);
    return;
  }

  console.log('fetch subscriptions');

  const subscriptions = await findByReceiver(
    receiverEnsPrimaryName,
    receiverAddress,
  );

  console.log('fetch subscriptions result', subscriptions);

  const promises = subscriptions.map(async (subscription: any) => {
    try {
      const msg = `Payment received: https://yodl.me/tx/${txHash}`;
      const opts: any = {};
      if (subscription.topicId) {
        opts.message_thread_id = subscription.topicId;
      }

      const result = await bot.telegram.sendMessage(
        subscription.groupId,
        msg,
        opts,
      );

      return {
        subscription,
        groupId: subscription.groupId,
        msg,
        result,
      };
    } catch (err) {
      console.log('error', err);
      return false;
    }
  });

  console.log('promises done');

  const resp = await Promise.all(promises);

  console.log('promises awaited');

  return resp;
}

const CURRENCY_WHITELIST = [
  'USD',
  'EUR',
  'CHF',
  'CAD',
  'AUD',
  'NZD',
  'SGD',
  'GBP',
  'BRL',
];

const SPAM_THRESHOLD = 0.01;

function isSpam(payment: PaymentSimple) {
  // check that symbol is in tokenlists and that it's a USD-ish stablecoin
  if (
    !tokenlist.some(
      (token) =>
        token.currency &&
        CURRENCY_WHITELIST.includes(token.currency) &&
        token.symbol.toUpperCase() === payment.tokenOutSymbol.toUpperCase(),
    )
  ) {
    console.log(`tokenOutSymbol not supported:`, payment.tokenOutSymbol);
    return true;
  }

  if (Number(payment.tokenOutAmountGross) < SPAM_THRESHOLD) {
    console.log(
      `tokenOutAmountGross is below spam threshold:`,
      payment.tokenOutAmountGross,
    );
    return true;
  }

  return false;
}

//dev mode
ENVIRONMENT !== 'production' && development(bot);
