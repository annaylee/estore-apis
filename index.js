if (process.env.NODE !== 'production') require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors'); // npm install cors
const morgan = require('morgan');
const authJwt = require('./helpers/authJwt');
const errorHandler = require('./helpers/errorHandler');

// Import Routers
const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');

// Enable Cross-Origin Resource Sharing 
// CORS goes hand in hand with APIs. A good use case of CORS is
// when developing RESTful APIs to accept rquests from different domains.
// Express CORS Configuration: https://github.com/expressjs/cors
// app.use(cors()); is to configure server to make it accessible to 
// any domain that requests a resource from your server via a browser.
// Calling cors() with no additional info will set the following defaults.
// {
//   "origin": "*",
//   "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//   "preflightContinue": false,
//   "optionsSuccessStatus": 204
// }
// They are translated into these headers:
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
// Status Code: 204
app.use(cors()); // Allow GET, HEAD, PUT, PATCH, POST, DELETE request from all origins
app.options('*', cors); // Allow OPTIONS requests from all origins

// Middleware
// express.json() allows client to pass a JSON to the backend
// We will be using Postman as the client to test our backend APIs
// For express.static(), we need to provide the first argument because
// we define '/public/uploads' in Jwt path to exclude from authentication. 
// Also need the __dirname or it won't show the images
// Use browser to test: http://localhost:3000/public/uploads/car1.jpeg
app.use(morgan('tiny'));
app.use(express.json());  
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

// Database Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URL, 
                {useNewUrlParser: true, useUnifiedTopology: true, dbName: 'estore-database'})
.then(()=>{
    console.log('Database connected...')
})
.catch(err=>{
    console.log(err);
});

// Register Routers
app.use(`${process.env.API_VERSION}/categories`, categoriesRouter);
app.use(`${process.env.API_VERSION}/products`, productsRouter);
app.use(`${process.env.API_VERSION}/orders`, ordersRouter);
app.use(`${process.env.API_VERSION}/users`, usersRouter);

// Server
app.listen( process.env.PORT || 3000, ()=>{
    console.log('Server is running...');
});