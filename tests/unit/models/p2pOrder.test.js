const mongoose = require('mongoose');
const P2pOrder = require('../../../model/p2pOrder');

describe('P2P Order Model Test', () => {
     beforeAll(async () => {
          await mongoose.connect(global.__MONGO_URI__, {
               useNewUrlParser: true,
               useUnifiedTopology: true,
          });
     });

     afterAll(async () => {
          await mongoose.connection.close();
     });

     it('should create & save order successfully', async () => {
          const validOrder = new P2pOrder({
               p2pAd: new mongoose.Types.ObjectId(),
               buyer: new mongoose.Types.ObjectId(),
               seller: new mongoose.Types.ObjectId(),
               crypto: 'btc',
               fiatAmount: 1000,
               cryptoAmount: 0.05,
               rate: 20000,
               fiatCurrency: 'USD',
               paymentMethod: 'banktransfer'
          });
          const savedOrder = await validOrder.save();

          expect(savedOrder._id).toBeDefined();
          expect(savedOrder.status).toBe('pending_payment');
     });

     it('should fail to save with invalid crypto', async () => {
          const orderWithInvalidCrypto = new P2pOrder({
               p2pAd: new mongoose.Types.ObjectId(),
               buyer: new mongoose.Types.ObjectId(),
               seller: new mongoose.Types.ObjectId(),
               crypto: 'INVALID_CRYPTO',
               fiatAmount: 1000,
               cryptoAmount: 0.05,
               rate: 20000,
               fiatCurrency: 'USD',
               paymentMethod: 'banktransfer'
          });

          let err;
          try {
               await orderWithInvalidCrypto.save();
          } catch (error) {
               err = error;
          }
          expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
     });
}); 