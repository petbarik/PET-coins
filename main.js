(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    return;
  }

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
            isAsync: true,
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
            text: 'transaction succes?',
            arguments: {}
          },
          {
            opcode: 'transactionMadeReset',
            blockType: Scratch.BlockType.COMMAND,
            text: 'reset transaction status',
            arguments: {}
          },
          {
            opcode: 'getCoins',
            blockType: Scratch.BlockType.REPORTER,
            isAsync: true,
            text: 'coins of card [CARD]',
            arguments: {
              CARD: { type: Scratch.ArgumentType.NUMBER }
            }
          }
        ]
      };
    }

    calculateFees(amount) {
      return (amount - (amount - (amount / 16)));
    }

    async makeTransaction(args) {
      const from = String(args.FROM);
      const verPIN = String(args.PIN);
      const to = String(args.TO);
      const amount = args.AMOUNT;

      const storedPin = JSON.parse(
        await this.firebaseRequest("GET", "/cards/" + from + "/pin")
      );

      const cards = JSON.parse(
        await this.firebaseRequest("GET", "/cards")
      ) ?? {};

      const result = confirm("Do you want to send " + String(amount) + " to " + to + " ?");

      if (
        verPIN == storedPin &&
        from != to &&
        to in cards &&
        (await this.getCoins({ CARD: from })) >= amount &&
        result
      ) {
        const fee = this.calculateFees(amount);
        const now = Date.now().toString();

        const fromTxRaw =
          JSON.parse(
            await this.firebaseRequest(
              "GET",
              "/cards/" + from + "/transactions"
            )
          ) ?? {};
        const fromTx = Object.values(fromTxRaw);
        fromTx.push({
          amount: String(amount),
          card: to,
          date: now,
          fees: String(fee),
          type: "send"
        });
        await this.firebaseRequest(
          "PUT",
          "/cards/" + from + "/transactions",
          fromTx
        );

        const fromCoins = (await this.getCoins({ CARD: from })) - amount;
        await this.firebaseRequest(
          "PUT",
          "/cards/" + from + "/coins",
          fromCoins
        );

        const toTxRaw =
          JSON.parse(
            await this.firebaseRequest(
              "GET",
              "/cards/" + to + "/transactions"
            )
          ) ?? {};
        const toTx = Object.values(toTxRaw);
        toTx.push({
          amount: String(amount),
          card: from,
          date: now,
          fees: String(fee),
          type: "recive"
        });
        await this.firebaseRequest(
          "PUT",
          "/cards/" + to + "/transactions",
          toTx
        );

        const toCoins =
          (await this.getCoins({ CARD: to })) + (amount - fee);
        await this.firebaseRequest(
          "PUT",
          "/cards/" + to + "/coins",
          toCoins
        );

        const netTxRaw =
          JSON.parse(
            await this.firebaseRequest(
              "GET",
              "/cards/" + this.networkOwner + "/transactions"
            )
          ) ?? {};
        const netTx = Object.values(netTxRaw);
        netTx.push({
          amount: String(fee),
          card: this.networkOwner,
          date: now,
          fees: "0",
          type: "network-fee"
        });
        await this.firebaseRequest(
          "PUT",
          "/cards/" + this.networkOwner + "/transactions",
          netTx
        );

        const netCoins =
          (await this.getCoins({ CARD: this.networkOwner })) + fee;
        await this.firebaseRequest(
          "PUT",
          "/cards/" + this.networkOwner + "/coins",
          netCoins
        );

        this.TransactionSucces = true;
      }
    }

    transactionMade() {
      return this.TransactionSucces;
    }

    transactionMadeReset() {
      this.TransactionSucces = false;
    }

    async getCoins(args) {
      const card = String(args.CARD);
      const raw = await this.firebaseRequest(
        "GET",
        "/cards/" + card + "/coins"
      );
      if (raw === null || raw === undefined || raw === "null") {
        return 0;
      }
      const value = JSON.parse(raw);
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    }

    async firebaseRequest(method, path, body = null) {
      const options = {
        method,
        headers: { "Content-Type": "application/json" }
      };
      if (body !== null) options.body = JSON.stringify(body);
      try {
        const response = await fetch(
          this.baseUrl + path + ".json",
          options
        );
        const data = await response.json();
        return JSON.stringify(data);
      } catch (e) {
        return JSON.stringify({ error: e.message });
      }
    }
  }

  Scratch.extensions.register(new PETCoins());
})(Scratch);
