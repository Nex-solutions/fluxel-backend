const request = require('supertest');
const app = require('../../index');
const mongoose = require('mongoose');
const User = require('../../model/user');
describe('P2P Order API', () => {
     let token;
     let testUser;

     beforeAll(async () => {
          // Setup test user and get token
          testUser = await User.create({
               email: 'test@example.com',
               password: 'password123'
          });
          token = generateToken(testUser);
     });

     afterAll(async () => {
          await mongoose.connection.close();
     });

     describe('POST /api/p2p/orders', () => {
          it('should create a new order', async () => {
               const response = await request(app)
                    .post('/api/p2p/orders')
                    .set('FluxelAccessToken', token)
                    .send({
                         p2pAd: new mongoose.Types.ObjectId(),
                         crypto: 'btc',
                         fiatAmount: 1000,
                         paymentMethod: 'banktransfer'
                    });

               expect(response.status).toBe(201);
               expect(response.body.data).toHaveProperty('_id');
          });
     });
}); 