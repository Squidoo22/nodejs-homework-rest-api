const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');

const { DB_HOST } = process.env;

describe('test user login', () => {
  let server;
  const loginDate = {
    email: 'dmytro53@gmail.com',
    password: '123456',
    subscription: 'starter',
  };
  beforeAll(() => (server = app.listen(7770)));
  afterAll(() => server.close());

  beforeEach((done) => {
    mongoose.connect(DB_HOST).then(() => done());
  });

  afterEach((done) => {
    mongoose.connection.close(() => done());
  });

  test('response shold return status code 200', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send(loginDate);

    expect(response.statusCode).toBe(200);
  });

  test('response shold contain toke', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send(loginDate);

    expect(response.body.token).toBeTruthy();
  });

  test('response shold contain user object with email and subscription properties', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send(loginDate);

    expect(response.body.user.email).toBeTruthy();
    expect(response.body.user.subscription).toBeTruthy();

    expect(typeof response.body.user.email).toBe('string');
    expect(typeof response.body.user.subscription).toBe('string');
  });
});
