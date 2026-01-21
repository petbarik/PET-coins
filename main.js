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
            'transaction made from [FROM] to [TO] amount [AMOUNT] ?',
          arguments: {
            FROM: { type: Scratch.ArgumentType.NUMBER },
            TO: { type: Scratch.ArgumentType.NUMBER },
            AMOUNT: { type: Scratch.ArgumentType.NUMBER }
          }
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
  async transactionMade(args) {
   
  }

  /* ===== REPORTER BLOCK ===== */
 async getCoins(args) {
  const card = String(args.CARD);

  const fetchData = async () => {
    try {
      const response = await fetch(this.baseUrl + "/cards/" + card + "/coins.json", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return JSON.stringify(data);
    } catch (e) {
      return JSON.stringify({ error: e.message });
    }
  };

    return await fetchData();
  }
}

Scratch.extensions.register(new PETCoins());
