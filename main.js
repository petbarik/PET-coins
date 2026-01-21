class PETCoins {
  constructor() {
    this.baseUrl =
      'https://pet-coin-default-rtdb.europe-west1.firebasedatabase.app';
    this.TransactionSucces = false;
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
            'transaction from card [FROM] PIN [PIN] to card [TO] amount [AMOUNT]',
          arguments: {
            FROM: { type: Scratch.ArgumentType.NUMBER },
            PIN: { type: Scratch.ArgumentType.NUMBER },
            TO: { type: Scratch.ArgumentType.NUMBER },
            AMOUNT: { type: Scratch.ArgumentType.NUMBER }
          }
        },
        {
          opcode: 'transactionMade',
          blockType: Scratch.BlockType.BOOLEAN,
          text:
            'transaction succes?',
          arguments: {}
        },
        {
          opcode: 'transactionMadeReset',
          blockType: Scratch.BlockType.COMMAND,
          text:
            'reset transaction status',
          arguments: {}
        },
        {
          opcode: 'getCoins',
          blockType: Scratch.BlockType.REPORTER,
          text: 'coins of card [CARD]',
          arguments: {
            CARD: { type: Scratch.ArgumentType.NUMBER }
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
    
  }

  /* ===== BOOLEAN BLOCK ===== */
  async transactionMade() {
    return (this.TransactionSucces);
  }

  async transactionMadeReset() {
    this.TransactionSucces = false;
  }

  /* ===== REPORTER BLOCK ===== */
 async getCoins(args) {
  const card = String(args.CARD);
    let coins = await this.firebaseRequest("GET", "/cards/" + card + "/coins");
    
    if (coins === null || coins === undefined) {
      coins = 0;
    };

    return coins;
  }

  async firebaseRequest(method, path, body = null) {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };

    if (body !== null) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(this.baseUrl + path + ".json", options);
      const data = await response.json();
      return JSON.stringify(data);
    } catch (e) {
      return JSON.stringify({ error: e.message });
    }
  }
}

Scratch.extensions.register(new PETCoins());
