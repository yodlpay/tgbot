# Yodl Telegram Bot

Telegram bot for yodl.me. This bot receives a webhook everytime a yodl payment happens.

Telegram users can add the telegram bot and subscribe to be notified when a payment happens.

## Commands

- `/subscribe RECEIVER` - Subscribe to a payment
- `/unsubscribe RECEIVER` - Unsubscribe from a payment
- `/list` - List all subscriptions

## subscribe command

`/subscribe [to:]receiver [from:sender] [status:(success|semifinal|final)]`

### Examples

- `/subscribe 0xAddress`
- `/subscribe vitalik.eth`

Which is equivalant to:

- `/subscribe to:vitalik.eth`