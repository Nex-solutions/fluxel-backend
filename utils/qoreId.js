const axios = require('axios');
require('dotenv').config();

class QoreIDClient {
     constructor() {
          this.baseURL = process.env.QOREID_BASE_URL || 'https://api.qoreid.com';
          this.token = null;
          this.tokenExpiry = null;
     }

     async getToken() {
          if (this.token && this.tokenExpiry > Date.now()) {
               return this.token;
          }

          try {
               const response = await axios.post(`${this.baseURL}/token`, {
                    clientId: process.env.QOREID_CLIENT_ID,
                    secret: process.env.QOREID_SECRET
               }, {
                    headers: {
                         'Accept': 'text/plain',
                         'Content-Type': 'application/json'
                    }
               });

               this.token = response.data.accessToken;
               // Set token expiry based on the response (e.g., 7200 seconds from now)
               this.tokenExpiry = Date.now() + (parseInt(response.data.expiresIn) * 1000);
               return this.token;
          } catch (error) {
               console.error('QoreID token error:', error);
               throw new Error('Failed to get QoreID token');
          }
     }
     //     }

     async verifyNIN(ninNumber, userData) {
          try {
               const token = await this.getToken();
               const response = await axios.post(
                    `${this.baseURL}/v1/ng/identities/nin/${ninNumber}`,
                    {
                         firstname: userData.firstname,
                         lastname: userData.lastname,
                         dob: userData.dob,
                         // phone: userData.phone,
                         email: userData.email,
                         gender: userData.gender
                    },
                    {
                         headers: {
                              'Authorization': `Bearer ${token}`,
                              'Accept': 'application/json',
                              'Content-Type': 'application/json'
                         }
                    }
               );

               const responseData = response.data;

               const result = {
                    id: responseData.id,
                    applicant: {
                         firstname: responseData.applicant.firstname,
                         lastname: responseData.applicant.lastname
                    },
                    summary: {
                         nin_check: {
                              status: responseData.summary.nin_check.status,
                              fieldMatches: responseData.summary.nin_check.fieldMatches
                         }
                    },
                    status: {
                         state: responseData.status.state,
                         status: responseData.status.status
                    },
                    nin: {
                         nin: responseData.nin.nin,
                         firstname: responseData.nin.firstname,
                         lastname: responseData.nin.lastname,
                         middlename: responseData.nin.middlename,
                         phone: responseData.nin.phone,
                         gender: responseData.nin.gender,
                         birthdate: responseData.nin.birthdate,
                         photo: responseData.nin.photo,
                         address: responseData.nin.address
                    }
               };

               return { success: true, data: result };
          } catch (error) {
               return {
                    success: false,
                    error: error.response?.data?.message || 'NIN verification failed'
               };
          }
     }

     async verifyBVN(bvnNumber, userData) {
          try {
               const token = await this.getToken();
               const response = await axios.post(
                    `${this.baseURL}/v1/ng/identities/bvn-basic/${bvnNumber}?isBvnIgree=true`,
                    {
                         firstname: userData.firstname,
                         lastname: userData.lastname,
                         dob: userData.dob,
                         phone: userData.phone,
                         email: userData.email,
                         gender: userData.gender
                    },
                    {
                         headers: {
                              'Authorization': `Bearer ${token}`,
                              'Accept': 'application/json',
                              'Content-Type': 'application/json'
                         }
                    }
               );
               return { success: true, data: response.data };
          } catch (error) {
               return {
                    success: false,
                    error: error.response?.data?.message || 'BVN verification failed'
               };
          }
     }

     async getWorkflowStatus(customerReference) {
          try {
               const token = await this.getToken();
               const response = await axios.get(
                    `${this.baseURL}/v1/workflows/customerReference/${customerReference}`,
                    {
                         headers: {
                              'Authorization': `Bearer ${token}`,
                              'Accept': 'application/json'
                         }
                    }
               );
               return { success: true, data: response.data };
          } catch (error) {
               return {
                    success: false,
                    error: error.response?.data?.message || 'Failed to get workflow status'
               };
          }
     }
}

module.exports = new QoreIDClient(); 