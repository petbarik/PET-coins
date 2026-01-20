class PETCoins {
  constructor() {
    this.baseUrl =
      'https://pet-coin-default-rtdb.europe-west1.firebasedatabase.app';
    this.networkOwner = '10000000';
  }

  getInfo() {
    return {
      id: 'petcoins',
      name: 'PET Coins',
      blocks: [
        {
          opcode: 'makeTransaction',
          blockType: Scratch.BlockType.COMMAND,
          text:
            'Make transaction from card [FROM] PIN [PIN] to card [TO] amount [AMOUNT]',
          arguments: {
            FROM: { type: Scratch.ArgumentType.STRING },
            PIN: { type: Scratch.ArgumentType.STRING },
            TO: { type: Scratch.ArgumentType.STRING },
            AMOUNT: { type: Scratch.ArgumentType.NUMBER }
          }
        },
        {
          opcode: 'transactionMade',
          blockType: Scratch.BlockType.BOOLEAN,
          text:
            'transaction made from [FROM] to [TO] amount [AMOUNT] ?',
          arguments: {
            FROM: { type: Scratch.ArgumentType.STRING },
            TO: { type: Scratch.ArgumentType.STRING },
            AMOUNT: { type: Scratch.ArgumentType.NUMBER }
          }
        },
        {
          opcode: 'getCoins',
          blockType: Scratch.BlockType.REPORTER,
          text: 'coins of card [CARD]',
          arguments: {
            CARD: { type: Scratch.ArgumentType.STRING }
          }
        }
      ]
    };
  }

  /* ===== Fee calculation (matches your calculate fees block) ===== */
  calculateFees(amount) {
    // Same result as 25 → 1.5625
    return amount * 0.0625;
  }

  /* ===== COMMAND BLOCK ===== */
  async makeTransaction(args) {
    const from = String(args.FROM);
    const pin = String(args.PIN);
    const to = String(args.TO);
    const amount = Number(args.AMOUNT);

    if (!from || !to || amount <= 0) return;

    const now = Date.now().toString();
    const base = this.baseUrl;

    const fromCard = await (await fetch(`${base}/${from}.json`)).json();
    const toCard = await (await fetch(`${base}/${to}.json`)).json();
    const netCard = await (await fetch(`${base}/${this.networkOwner}.json`)).json();

    if (!fromCard || !toCard || !netCard) return;
    if (String(fromCard.pin) !== pin) return;
    if (Number(fromCard.coins) < amount) return;

    const fees = this.calculateFees(amount);

    const amountStr = String(amount);
    const feeStr = String(fees);

    const fromTx = Array.isArray(fromCard.transactions)
      ? [...fromCard.transactions]
      : [];
    const toTx = Array.isArray(toCard.transactions)
      ? [...toCard.transactions]
      : [];
    const netTx = Array.isArray(netCard.transactions)
      ? [...netCard.transactions]
      : [];

    /* Sender */
    fromTx.push({
      amount: amountStr,
      card: to,
      date: now,
      fees: feeStr,
      type: 'send'
    });

    /* Receiver */
    toTx.push({
      amount: amountStr,
      card: from,
      date: now,
      fees: feeStr,
      type: 'recive'
    });

    /* Network owner */
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

  /* ===== BOOLEAN BLOCK ===== */
  async transactionMade(args) {
    const from = String(args.FROM);
    const to = String(args.TO);
    const amount = String(args.AMOUNT);

    const res = await fetch(`${this.baseUrl}/${from}/transactions.json`);
    const txs = await res.json();

    if (!Array.isArray(txs)) return false;

    return txs.some(tx =>
      tx.type === 'send' &&
      tx.card === to &&
      tx.amount === amount
    );
  }

  /* ===== REPORTER BLOCK ===== */
  async getCoins(args) {
    const card = String(args.CARD);
    if (!card) return 0;

    const res = await fetch(`${this.baseUrl}/${card}/coins.json`);
    const coins = await res.json();

    return Number(coins) || 0;
  }
}

Scratch.extensions.register(new PETCoins());
