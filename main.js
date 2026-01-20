async makeTransaction(args) {
  const from = String(args.FROM);
  const pin = String(args.PIN);
  const to = String(args.TO);
  const amount = Number(args.AMOUNT);

  if (!from || !to || amount <= 0) return;

  const base = this.baseUrl;
  const now = Date.now().toString();

  const fromCard = await (await fetch(`${base}/${from}.json`)).json();
  const toCard = await (await fetch(`${base}/${to}.json`)).json();
  const netCard = await (await fetch(`${base}/${this.networkOwner}.json`)).json();

  if (!fromCard || !toCard || !netCard) return;
  if (String(fromCard.pin) !== pin) return;
  if (Number(fromCard.coins) < amount) return;

  const fees = this.calculateFees(amount);
  const feeStr = String(fees);
  const amountStr = String(amount);

  const fromTx = Array.isArray(fromCard.transactions)
    ? [...fromCard.transactions]
    : [];
  const toTx = Array.isArray(toCard.transactions)
    ? [...toCard.transactions]
    : [];
  const netTx = Array.isArray(netCard.transactions)
    ? [...netCard.transactions]
    : [];

  // Sender
  fromTx.push({
    amount: amountStr,
    card: to,
    date: now,
    fees: feeStr,
    type: 'send'
  });

  // Receiver
  toTx.push({
    amount: amountStr,
    card: from,
    date: now,
    fees: feeStr,
    type: 'recive'
  });

  // Network fee
  netTx.push({
    amount: feeStr,
    card: this.networkOwner,
    date: now,
    fees: '0',
    type: 'network-fee'
  });

  const updates = {
    [`${from}/coins`]: Number(fromCard.coins) - amount,
    [`${to}/coins`]: Number(toCard.coins) + amount,
    [`${this.networkOwner}/coins`]: Number(netCard.coins) + fees,

    [`${from}/transactions`]: fromTx,
    [`${to}/transactions`]: toTx,
    [`${this.networkOwner}/transactions`]: netTx
  };

  await fetch(`${base}/.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
}
