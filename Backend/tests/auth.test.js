const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user.model');
const tokenBlacklistModel = require('../src/models/blacklist.model');

describe('Authentication API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('1. should successfully register a new user and return token and user details', async () => {
      const payload = {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'SecurePassword123!',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User Registration Done');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: payload.name,
        email: payload.email,
      });
      expect(res.body.user).not.toHaveProperty('password');

      // Verify direct database state
      const savedUser = await userModel.findOne({ email: payload.email }).select('+password');
      expect(savedUser).not.toBeNull();
      expect(savedUser.name).toBe(payload.name);
      expect(savedUser.password).not.toBe(payload.password); // Confirms bcrypt hashed
    });

    it('should reject registration if email already exists with 422', async () => {
      const payload = {
        name: 'Bob Duplicate',
        email: 'bob@example.com',
        password: 'Password123!',
      };

      // First registration
      await request(app).post('/api/auth/register').send(payload);

      // Attempt duplicate registration
      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/already exist/i);
    });
  });

  describe('POST /api/auth/login', () => {
    const userCredentials = {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      password: 'MySecretPassword123!',
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userCredentials);
    });

    it('2. should successfully log in with valid credentials and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User Loggedin');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: userCredentials.name,
        email: userCredentials.email,
      });

      // Verify cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
    });

    it('3. should reject login with invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('3b. should reject login with non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully log out and blacklist the active JWT token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dave Logout',
          email: 'dave@example.com',
          password: 'Password123!',
        });

      const token = registerRes.body.token;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toMatch(/logged out successfully/i);

      // Verify token is in blacklist collection in database
      const blacklisted = await tokenBlacklistModel.findOne({ token });
      expect(blacklisted).not.toBeNull();

      // Subsequent request using blacklisted token should fail with 401
      const protectedRes = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedRes.status).toBe(401);
      expect(protectedRes.body.message).toMatch(/unauthorized/i);
    });
  });
});
