const swaggerUi = require('swagger-ui-express'); 
const swaggerJsdoc = require('swagger-jsdoc'); 

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'This is the API documentation for SlimMom backend',
            contact: {
                name: 'Daniela Badea',
                url: 'https://github.com/DanielaBadea',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local API base URL',
            },
            {
                url: 'https://slim-moom.goit.global',
                description: 'Production API base URL',
            },
        ],
    },
    
    apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
