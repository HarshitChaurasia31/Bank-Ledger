const request = require('supertest');
const app = require('../src/app');
const { seedSystemAccount, createTestUser, models } = require('./helpers');
const { accountModel, transactionModel, ledgerModel } = models;

describe('Account API Integration Tests', () => {
  let systemAccount;

  beforeEach(async () => {
    const seeded = await seedSystemAccount();
    systemAccount = seeded.systemAccount;
  });

  describe('POST /api/accounts (Account Creation & Initial Funding)', () => {
    it('4. should allow an authenticated user to create an account with initial funding', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('account');
      expect(res.body.account.user).toBe(user._id);
      expect(res.body.account.status).toBe('Active');
      expect(res.body.account.currency).toBe('INR');

      const createdAccountId = res.body.account._id;

      // Verify Account Document in DB
      const accountDoc = await accountModel.findById(createdAccountId);
      expect(accountDoc).not.toBeNull();
      expect(accountDoc.status).toBe('Active');

      // Verify Initial Funding Transaction in DB
      const initialTx = await transactionModel.findOne({
        toAccount: createdAccountId,
        type: 'INITIAL_FUND',
      });
      expect(initialTx).not.toBeNull();
      expect(initialTx.status).toBe('COMPLETED');
      expect(initialTx.amount).toBe(10000);
      expect(initialTx.fromAccount.toString()).toBe(systemAccount._id.toString());

      // Verify Exactly 2 Ledger Entries for Initial Funding (1 DEBIT on System, 1 CREDIT on User)
      const debitLedger = await ledgerModel.findOne({
        transaction: initialTx._id,
        type: 'DEBIT',
      });
      expect(debitLedger).not.toBeNull();
      expect(debitLedger.account.toString()).toBe(systemAccount._id.toString());
      expect(debitLedger.amount).toBe(10000);

      const creditLedger = await ledgerModel.findOne({
        transaction: initialTx._id,
        type: 'CREDIT',
      });
      expect(creditLedger).not.toBeNull();
      expect(creditLedger.account.toString()).toBe(createdAccountId);
      expect(creditLedger.amount).toBe(10000);
    });

    it('5. should reject unauthenticated account creation with 401', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });

  describe('GET /api/accounts and GET /api/accounts/balance/:accountId', () => {
    it('should list all accounts for authenticated user', async () => {
      const { user, token } = await createTestUser();

      // Create an account
      await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accounts');
      expect(Array.isArray(res.body.accounts)).toBe(true);
      expect(res.body.accounts.length).toBe(1);
      expect(res.body.accounts[0].user).toBe(user._id);
    });

    it('should return the correct balance derived from ledger aggregation', async () => {
      const { token } = await createTestUser();

      const accountRes = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      const accountId = accountRes.body.account._id;

      const balanceRes = await request(app)
        .get(`/api/accounts/balance/${accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(balanceRes.status).toBe(200);
      expect(balanceRes.body).toHaveProperty('accountId', accountId);
      expect(balanceRes.body).toHaveProperty('balance', 10000);
    });

    it('should return 404 when querying balance of an account not owned by user', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();

      // User A creates an account
      const accountResA = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${userA.token}`);

      const accountIdA = accountResA.body.account._id;

      // User B tries to check balance of User A's account
      const res = await request(app)
        .get(`/api/accounts/balance/${accountIdA}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/account not found/i);
    });
  });
});
