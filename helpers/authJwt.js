// npm install express-jwt for securing our backend apis by
// protecting routes from being accessed by unauthorized users

// Exclude login and register routes from authentication 
// So there is no need to enter 'Bearer Token' in 'Authorization'
// when testing Postman POST Requests: 
// http://localhost:3000/api/v1/users/login
// http://localhost:3000/api/v1/users/register

// Exclude products and featured products routes from authentication
// So there is no need to enter 'Bearer Token' in 'Authorization'
// when testing Postman GET Request:
// http://localhost:3000/api/v1/products
// http://localhost:3000/api/v1/products/featured
// When using { url: ..., methods: [] } to exclude paths, the url must be a regular expression
// with hardcoded strings. Do not use backticks to render ${process.env.API_VERSION}

// Exclude categories routes from authentication
// So there is no need to enter 'Bearer Token' in 'Authorization'
// when testing Postman GET Request:
// http://localhost:3000/api/v1/categories
// http://localhost:3000/api/v1/categories/get/count
// When using { url: ..., methods: [] } to exclude paths, the url must be a regular expression
// with hardcoded strings. Do not use backticks to render ${process.env.API_VERSION}

// What is http method: OPTIONS? https://reqbin.com/Article/HttpOptions

// Exclude images in /public/uploads from authentication
// We want to allow anyone to see the images in the /public/uploads folder
// We have to exclude it in Jwt to make the images available to the client side
// without authentication

const { expressjwt: jwt } = require('express-jwt');

function authJwt(){
    return jwt({
        secret: process.env.SECRET,
        algorithms: ['HS256'],
        isRevoked: isRevoked,
    }).unless({
        path: [
            `${process.env.API_VERSION}/users/login`,
            `${process.env.API_VERSION}/users/register`,
             { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS']},
             { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS']},
             { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS']}
        ]
    });
}

// isRevoke() has only two arguments: req and token
// Useful when you want to restrict access to admin-only routes??
async function isRevoked(req, token){
    if (!token.payload.userIsAdmin){  
        return true; // Return true for non-admin
    }
}

module.exports = authJwt;