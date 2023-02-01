const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const bcrypt = require('bcryptjs');  // npm install bcryptjs for password hashing
const jwt = require('jsonwebtoken'); // npm install jsonwebtoken for signing/generating a token

// Get all Users
// Postman GET Request: http://localhost:3000/api/v1/users/
// Use .select('a list of fields') to include fields 
// Use .select('-passwordHash') to exclude 'passwordHash' field
// Can't have multiple .select() to include fields and to exclude fields
router.get('/', async (req,res)=>{

    try {
        const users = await User.find()
        .select('-passwordHash') // Exclude 'passwordHash' 
        .sort({'name': 1});  

        if (!users) {
            return res.status(500).json({success: false, error: 'Unable to get users', data: null});
        }
        return res.status(200).json({success: true, message: users.length==0? 'No users': 'Users found', data: users});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get an Existing User by id
// Postman GET Request: http://localhost:3000/api/v1/users/??
router.get('/:id', async (req,res)=>{

    try {
        const user = await User.findById(req.params.id)       
        .select('-passwordHash'); // Exclude 'passwordHash'

        if (!user) {
            return res.status(500).json({success: false, error: 'Unable to get user with this id', data: null});
        }
        return res.status(200).json({success: true, message: 'User with this id has been found', data: user});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Post a new User ( Useful for Admin to add a new User from the Admin Panel )
// Postman POST Request: http://localhost:3000/api/v1/users with 'Body' -> 'Raw' -> 'JSON'
// All JSON field names ('name', 'email', 'phone') must be quoted or Postman will return Syntax Error
router.post('/', async (req,res)=>{

    try {
        // Use bcrypt.hashSync() to hash the plain text password provided by the user
        const user = new User({
            "name": req.body.name,
            "email": req.body.email,
            "passwordHash": bcrypt.hashSync(req.body.password,10),
            "phone": req.body.phone,
            "isAdmin": req.body.isAdmin,
            "street": req.body.street,
            "apartment": req.body.apartment,
            "city": req.body.city,
            "zip": req.body.zip,
            "country": req.body.country
        });
        const savedUser = await user.save();
        if (!savedUser){
            return res.status(400).json({success: false, error: 'Unable to post this user', data: null});
        }
        return res.status(201).json({success: true, message: 'This user has been posted', data: savedUser})
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get Count of Users
// Postman GET Request: http://localhost:3000/api/v1/users/get/count
// The route must be '/get/count', not '/getcount' or MongoDB will return an ObjectId Cast Error
// because it is trying to cast what is after '/users' as an ObjectId that is needed when getting
// a single user by providing an id params.
router.get('/get/count', async (req,res)=>{
    
    try {
        const count = await User.countDocuments(); 
        if (!count) {
            return res.status(500).json({success: false, error: 'Unable to get count of users', data: null});
        }
        return res.status(200).json({success: true, message: 'Count of users has been generated', data: {count: count}});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Register an User
// Postman POST Request: http://localhost:3000/api/v1/users/register
// What are differences between bcrypt.hash() & bcrypt.hashSync()?
// bcrypt is a npm module for password hashing. It supports both synchronous & asynchronous methods.
// bcrypt.hash takes a callback as its 3rd parameter that is called when the hash is completed. 
// It returns a promise in callback and you need to resolve the promise.
// bcrypt.hashSync runs the hash, waits for it to complete and returns the hashed value.
// In other words "hash" is asynchronous and hashSync is synschronous.
router.post('/register', async (req, res)=>{

    try {
        // Use bcrypt.hashSync() to hash the plain text password provided by the user
        const user = new User({
            "name": req.body.name,
            "email": req.body.email,
            "passwordHash": bcrypt.hashSync(req.body.password,10),
            "phone": req.body.phone,
            "isAdmin": req.body.isAdmin,
            "street": req.body.street,
            "apartment": req.body.apartment,
            "city": req.body.city,
            "zip": req.body.zip,
            "country": req.body.country
        });

        const savedUser = await user.save();
        if (!savedUser){
            return res.status(400).json({success: false, error: 'Unable to register this user', data: null});
        }
        return res.status(201).json({success: true, message: 'This user has been registered', data: savedUser})
    } catch (err) {
        console.log('catch err', err);
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Login an User 
// Postman POST Request: http://localhost:3000/api/v1/login
// Upon successful login, jwt will return an object containing the user email and a token
// How to create SECRET and REFRESH_SECRET with better security in the real world? (Learned from Web Dev Simplified)
// Open a new Terminal inside VSCode:
// >node
// >require('crypto').randomBytes(64).toString('hex')
// >run the above command again to get a different string for REFRESH_SECRET

// How to test this token in Postman?
// Postman POST Request: http://localhost:3000/api/v1/users/login with 'Body' -> 'Raw' -> 'JSON'
// Postman will return a token upon successful login. We then copy & paste this token inside jwt.io
// to see the decoded HEADER, PAYLOAD, and VERIFY SIGNATURE
router.post('/login', async (req, res)=>{

    try{
        // Check to see if the user email is already registered
        const user = await User.findOne({email: req.body.email});
        if (!user){
            return res.status(400).json({success: false, error: 'User with this email not found', data: null});
        } else {   
            // Check to see if req.body.password and user.passwordHash are the same
            if (bcrypt.compareSync(req.body.password, user.passwordHash)){
                // Once user is authenticated, use jwt.sign() to create a token 
                const token = jwt.sign({userId: user._id, userIsAdmin: user.isAdmin}, process.env.SECRET, {expiresIn: '1d'});
                // Sent token to the user for accessing the backend apis
                return res.status(200).json({ userEmail: user.email, userToken: token});
            } else {
                return res.status(400).json({success: false, error: 'Password not match', data: null});
            } 
        }  // end of outer if
    } catch(err){
        return res.status(500).json({success: false, error: err, data: null});
    } 
});

// Error Handler
router.use((err, req, res, next) => {
    // console.error(err.stack);
    return res.status(500).send({success: false, error: err});
});

module.exports = router;