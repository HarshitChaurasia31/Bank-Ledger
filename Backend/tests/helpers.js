const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const userModel = require('../src/models/user.model');
const accountModel = require('../src/models/account.model');
const ledgerModel = require('../src/models/ledger.model');
const transactionModel = require('../src/models/transaction.model');

/**
 * Initializes the system user and system account required by the initial fund logic.
 */
async function seedSystemAccount() {
  const systemUser = await userModel.create({
    name: 'System Admin',
    email: 'system@ledger.com',
    password: 'SystemPassword123!',
    systemUser: true,
  });

  const systemAccount = await accountModel.create({
    user: systemUser._id,
    status: 'Active',
    currency: 'INR',
  });

  process.env.SYSTEM_ACCOUNT_ID = systemAccount._id.toString();
  return { systemUser, systemAccount };
}

/**
 * Creates a test user directly in DB to bypass route rate limiters during fixture setup.
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@test.com`,
    password: 'Password123!',
  };
  const payload = { ...defaultData, ...userData };

  const user = await userModel.create(payload);
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '3d' }
  );

  return {
    user: { _id: user._id.toString(), name: user.name, email: user.email },
    token,
    credentials: { email: payload.email, password: payload.password },
  };
}

module.exports = {
  seedSystemAccount,
  createTestUser,
  models: {
    userModel,
    accountModel,
    ledgerModel,
    transactionModel,
  },
};
