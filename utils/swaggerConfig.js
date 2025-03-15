let swaggerJsdoc = require('swagger-jsdoc');
let { _configs } = require("../utils/config")

let options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: _configs.APP_NAME || 'My API',
            version: '1.0.0',
            description: _configs.APP_DESC || 'API Documentation for My Project',
        },
        components: {
            securitySchemes: {
                fluxelAccessToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'FluxelAccessToken',
                    description: 'Custom access token for authentication'
                }
            }
        },
        security: [
            { fluxelAccessToken: [] }
        ]
    },
    apis: ['./route/*.js'],
};

let swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
