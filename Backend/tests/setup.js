const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock email service to prevent external network calls
jest.mock('../src/services/email.service', () => ({
  sendRegistrationEmail: jest.fn().mockResolvedValue(true),
  sendTransactionEmail: jest.fn().mockResolvedValue(true),
  sendTransactionFailureEmail: jest.fn().mockResolvedValue(true),
}));

let replSet;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';

  // Start in-memory MongoDB replica set for transaction support
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();

  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
  }
}, 30000);

beforeEach(async () => {
  // Clear all collections
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
