import { Telegraf } from 'telegraf';

import { about } from './commands';
import { greeting } from './text';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import { URLSearchParams } from 'url';
import { Address } from 'cluster';
import { Hex, verifyMessage } from 'viem';
import assert = require('assert');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

bot.command('about', about());

// bot.on('message', greeting());

const YODL_WEBHOOK_ADDRESS = "0x66a31Aa400dd8C11f9af054c3b7bCcB783B4901B" as Hex;

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  if (req.url && req.url.startsWith('/v1/tx') && req.method === 'POST') {
    if (!req.headers) return;

    const signature = req.headers["x-yodl-signature"] as Hex;
    const addressShort = req.headers["x-yodl-address"] as Hex;

    assert(signature, "Signature is required");
    assert(signature, addressShort);
    assert(YODL_WEBHOOK_ADDRESS.startsWith(addressShort), "Invalid signing address");

    const isValidSignature = await verifyMessage({
      // This is buggy, should tap into raw request body instead.
      message: JSON.stringify(req.body),
      signature,
      address: YODL_WEBHOOK_ADDRESS,
    });

    if (!isValidSignature) {
      return res.status(401).send({ message: "Invalid signature" });
    }

    const queryString = req.url?.split('?')[1] || '';
    const params = new URLSearchParams(queryString);

    const groupId = params.get('id');
    if (groupId) {
      await bot.telegram.sendMessage(groupId, `payment arrived https://yodl.me/tx/${req.body.txHash}`);
    }
    // curl "https://yodl-tg.vercel.app/v1/tx?id=-1002437707079" -X POST -d '{"txHash":"0xd873efc81150f79c4eb68033341f09640bb1259db68aece385002dab6ce3bc37","chainId":100}' -H "Content-Type: application/json"
    res.status(200).send('OK');
  } else {
    await production(req, res, bot);
  }
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
