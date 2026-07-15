# 💳 Ledger Banking API

A production-inspired banking backend built with **Node.js**, **Express.js**, and **MongoDB**, simulating core banking operations — account creation, secure money transfers, transaction history, and double-entry ledger accounting.

Built with scalability, consistency, and security in mind, the API implements ACID transactions, idempotent transfers, JWT authentication, and role-based authorization.

---

## 🚀 Features

**Authentication**
- User registration & secure login/logout
- JWT-based authentication
- Password hashing with bcrypt

**Account Management**
- Create bank accounts
- View account details
- Check account balance

**Transactions**
- Transfer money atomically
- Initial system funding
- Transaction history & status tracking
- Idempotent transfers (safe retries via idempotency keys)

**Ledger System**
- Double-entry ledger (debit + credit entries)
- Full audit trail

**Security**
- JWT-protected routes with authorization middleware
- MongoDB multi-document transactions
- Input validation and centralized error handling

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Docker | Containerization |
| Nodemailer | Email notifications |

---

## 🏗 Architecture

```
Client
  │
  ▼
Express Server → Routes → Controllers → Services → Repositories (Mongoose) → MongoDB
```

---

## 📂 Folder Structure

```
ledger-banking-api/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── app.js
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## ⚙️ Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/ledger-banking-api.git
cd ledger-banking-api
```

**2. Install dependencies**
```bash
npm install
```

**3. Create a `.env` file**
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
```

**4. Run locally**
```bash
npm run dev
```

**5. Or run with Docker**
```bash
docker compose up --build
```

---

## 📖 API Overview

**Authentication**
| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| POST | `/api/auth/logout` | Log out the current user |

**Accounts**
| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/accounts` | Create a new bank account |
| GET | `/api/accounts/:id` | Get account details |
| GET | `/api/accounts/:id/balance` | Get account balance |

**Transactions**
| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/transactions` | Initiate a money transfer |
| GET | `/api/transactions` | List transaction history |
| GET | `/api/transactions/:id` | Get a specific transaction |

---

## 💰 Money Transfer Flow

```
1. Validate JWT
2. Validate sender balance
3. Start MongoDB transaction
4. Debit sender / Credit receiver
5. Create ledger entries
6. Update transaction status
7. Commit transaction
8. Send email notification
```

---

## 🔐 Security Features

- JWT authentication with protected routes
- Password hashing (bcrypt)
- MongoDB ACID transactions
- Idempotent request handling
- Role-based authorization
- Input validation on all endpoints

---

## 📈 Roadmap

- [ ] Redis caching
- [ ] Refresh tokens
- [ ] OTP verification
- [ ] PDF bank statements
- [ ] Swagger / OpenAPI documentation
- [ ] Unit & integration test suite
- [ ] Audit logs
- [ ] Rate limiting

---

## 📸 Screenshots

| | |
|---|---|
| Architecture | ![Architecture](screenshots/architecture.png) |
| Swagger Documentation | ![Swagger](screenshots/swagger.png) |
| Postman Collection | ![Postman](screenshots/postman.png) |
| MongoDB Collections | ![MongoDB](screenshots/database.png) |
| Docker Containers | ![Docker](screenshots/docker.png) |
| Successful Money Transfer | ![Transfer](screenshots/transfer.png) |

---

## ⭐ Highlights

✔ Secure authentication · ✔ Double-entry ledger · ✔ MongoDB transactions
✔ Idempotent transfers · ✔ Dockerized · ✔ RESTful API · ✔ Email notifications

---

## 👨‍💻 Author

**Harshit Chaurasia**
B.Tech CSE | Backend Developer
