const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const { seedSystemAccount, createTestUser, models } = require('./helpers');
const { transactionModel, ledgerModel } = models;

describe('Transaction & Ledger Safety Integration Tests', () => {
  let senderUser, receiverUser;
  let senderAccount, receiverAccount;

  beforeEach(async () => {
    await seedSystemAccount();

    // Create Sender user & account (has 10,000 INR initial balance)
    senderUser = await createTestUser({ name: 'Sender User' });
    const senderAccRes = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${senderUser.token}`);
    senderAccount = senderAccRes.body.account;

    // Create Receiver user & account (has 10,000 INR initial balance)
    receiverUser = await createTestUser({ name: 'Receiver User' });
    const receiverAccRes = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${receiverUser.token}`);
    receiverAccount = receiverAccRes.body.account;
  });

  describe('POST /api/transactions (Money Movement & Ledger Invariants)', () => {
    it('6, 7, 8. should execute a successful transfer and create exactly one DEBIT and one CREDIT ledger entry', async () => {
      const idempotencyKey = crypto.randomUUID();
      const transferAmount = 2500;

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: receiverAccount._id,
          amount: transferAmount,
          idempotencyKey,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Transaction completed successfullly');
      expect(res.body.transaction).toMatchObject({
        fromAccount: senderAccount._id,
        toAccount: receiverAccount._id,
        amount: transferAmount,
        status: 'COMPLETED',
        type: 'TRANSFER',
        idempotencyKey,
      });

      const transactionId = res.body.transaction._id;

      // 6. Direct DB verification: Transaction record status
      const txInDb = await transactionModel.findById(transactionId);
      expect(txInDb).not.toBeNull();
      expect(txInDb.status).toBe('COMPLETED');
      expect(txInDb.amount).toBe(transferAmount);

      // 7. Verify exactly one DEBIT ledger entry for sender account
      const debitLedgers = await ledgerModel.find({
        transaction: transactionId,
        type: 'DEBIT',
      });
      expect(debitLedgers.length).toBe(1);
      expect(debitLedgers[0].account.toString()).toBe(senderAccount._id.toString());
      expect(debitLedgers[0].amount).toBe(transferAmount);

      // 8. Verify exactly one CREDIT ledger entry for receiver account
      const creditLedgers = await ledgerModel.find({
        transaction: transactionId,
        type: 'CREDIT',
      });
      expect(creditLedgers.length).toBe(1);
      expect(creditLedgers[0].account.toString()).toBe(receiverAccount._id.toString());
      expect(creditLedgers[0].amount).toBe(transferAmount);

      // Verify Total Ledgers for this transaction is strictly 2
      const allLedgersForTx = await ledgerModel.find({ transaction: transactionId });
      expect(allLedgersForTx.length).toBe(2);

      // Verify Sender balance decreased to 7,500 INR
      const senderBalRes = await request(app)
        .get(`/api/accounts/balance/${senderAccount._id}`)
        .set('Authorization', `Bearer ${senderUser.token}`);
      expect(senderBalRes.body.balance).toBe(7500);

      // Verify Receiver balance increased to 12,500 INR
      const receiverBalRes = await request(app)
        .get(`/api/accounts/balance/${receiverAccount._id}`)
        .set('Authorization', `Bearer ${receiverUser.token}`);
      expect(receiverBalRes.body.balance).toBe(12500);
    });

    it('9. should reject zero amount transfers with 400', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: receiverAccount._id,
          amount: 0,
          idempotencyKey: crypto.randomUUID(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/amount must be a positive number/i);
    });

    it('9b. should reject negative amount transfers with 400', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: receiverAccount._id,
          amount: -500,
          idempotencyKey: crypto.randomUUID(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/amount must be a positive number/i);
    });

    it('10. should reject self-transfers where fromAccount equals toAccount with 400', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: senderAccount._id,
          amount: 1000,
          idempotencyKey: crypto.randomUUID(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot transfer to the same account/i);
    });

    it('11. should reject transfer if user attempts to transfer from an account they do not own with 400', async () => {
      // Receiver tries to transfer FROM Sender's account without authorization
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${receiverUser.token}`)
        .send({
          fromAccount: senderAccount._id, // Not owned by receiverUser
          toAccount: receiverAccount._id,
          amount: 1000,
          idempotencyKey: crypto.randomUUID(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid account credentials/i);
    });

    it('12. should reject transfer if sender has insufficient balance with 400', async () => {
      // Sender only has 10,000 INR; tries to transfer 15,000 INR
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: receiverAccount._id,
          amount: 15000,
          idempotencyKey: crypto.randomUUID(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/insufficient balance/i);

      // Verify sender balance remains unchanged at 10,000 INR
      const senderBalRes = await request(app)
        .get(`/api/accounts/balance/${senderAccount._id}`)
        .set('Authorization', `Bearer ${senderUser.token}`);
      expect(senderBalRes.body.balance).toBe(10000);
    });

    it('13. should handle idempotent retries: repeating request with same key returns cached result without duplicate ledger entries', async () => {
      const idempotencyKey = crypto.randomUUID();
      const transferAmount = 3000;

      // 1. Initial Request
      const firstRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: receiverAccount._id,
          amount: transferAmount,
          idempotencyKey,
        });

      expect(firstRes.status).toBe(201);
      const originalTxId = firstRes.body.transaction._id;

      // Count transactions and ledgers after first request
      const txCountAfterFirst = await transactionModel.countDocuments({ idempotencyKey });
      const ledgerCountAfterFirst = await ledgerModel.countDocuments({ transaction: originalTxId });
      expect(txCountAfterFirst).toBe(1);
      expect(ledgerCountAfterFirst).toBe(2);

      // 2. Retry with the SAME idempotencyKey
      const retryRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: receiverAccount._id,
          amount: transferAmount,
          idempotencyKey,
        });

      // Backend returns 200 with "Transaction already processed"
      expect(retryRes.status).toBe(200);
      expect(retryRes.body.message).toMatch(/already processed/i);
      expect(retryRes.body.transaction._id).toBe(originalTxId);

      // 3. Verify NO duplicate transaction documents created
      const txCountAfterRetry = await transactionModel.countDocuments({ idempotencyKey });
      expect(txCountAfterRetry).toBe(1);

      // 4. Verify NO duplicate ledger entries created
      const ledgerCountAfterRetry = await ledgerModel.countDocuments({ transaction: originalTxId });
      expect(ledgerCountAfterRetry).toBe(2);

      // 5. Verify balances were deducted only ONCE
      const senderBalRes = await request(app)
        .get(`/api/accounts/balance/${senderAccount._id}`)
        .set('Authorization', `Bearer ${senderUser.token}`);
      expect(senderBalRes.body.balance).toBe(7000); // 10,000 - 3,000 (NOT deducted twice)

      const receiverBalRes = await request(app)
        .get(`/api/accounts/balance/${receiverAccount._id}`)
        .set('Authorization', `Bearer ${receiverUser.token}`);
      expect(receiverBalRes.body.balance).toBe(13000); // 10,000 + 3,000
    });
  });

  describe('GET /api/transactions/history', () => {
    it('should retrieve transaction history including transfers involving the user account', async () => {
      // Execute a transfer
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderUser.token}`)
        .send({
          fromAccount: senderAccount._id,
          toAccount: receiverAccount._id,
          amount: 1200,
          idempotencyKey: crypto.randomUUID(),
        });

      // Query history as sender
      const res = await request(app)
        .get('/api/transactions/history')
        .set('Authorization', `Bearer ${senderUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBe(true);
      // Sender has initial fund transaction + transfer transaction
      expect(res.body.transactions.length).toBeGreaterThanOrEqual(2);
    });
  });
});
