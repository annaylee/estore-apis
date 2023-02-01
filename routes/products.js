const express = require('express');
const { default: mongoose } = require('mongoose');
const router = express.Router();
const { Category } = require('../models/Category');
const { Product } = require('../models/Product');
const multer = require('multer'); // for image upload 

// Multer is a node.js middleware for handling multipart/form-data, 
// which is primarily used for uploading files using a form. 
// The disk storage engine gives you full control over the naming of the files
// on the server to avoid files with the same names being overwritten.

// There are two options available, destination and filename. 
// They are both functions that determine where the file should be stored.

// destination is used to determine within which folder the uploaded files 
// should be stored. If no destination is given, the operating system's default 
// directory for temporary files is used. You are responsible for creating the 
// directory when providing destination as a function. 

// filename is used to determine what the file should be named inside the folder. 
// If no filename is given, each file will be given a random name that doesn't 
// include any file extension. Multer will not append any file extension for you, 
// your function should return a filename complete with an file extension.

const MIME_TYPES = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png"
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let error = new Error('Invalid Image Type');
        if (MIME_TYPES[file.mimetype]) error = null; 
        // Must be 'public/uploads', not '/public/uploads' or get multor 4058 error; not sure why?
        cb(error, 'public/uploads');  // The callback will be called with an error for invalid image types
    },

    // Replace the spaces in file name with a dash; can't allow spaces in file names on server
    // Each file uploaded using multor contains the following:
    // file.originalname: name of the file on the user's computer
    // file.fieldname: field name specified in the form
    // file.mimetype: mime type of the file
    // file.filename: the name of the file within the destination (not full path)

    filename: function (req, file, cb) {
      const fileName = file.originalname.replace(' ', '-'); // same as .split(' ').join('-')
      const ext = MIME_TYPES[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${ext}`);  
    }
});
 
const uploadOptions = multer({ storage: storage });

// Get all Products or Products with Matching Categories
// Postman GET Request: http://localhost:3000/api/v1/products OR
// Postman GET Request: http://localhost:3000/api/v1/products?categories=63ceed5ab00556b8c16ec547,63ceeeccba4e09ac7d7ff5b5
router.get('/', async (req,res)=>{

    try {
        let filter = {};
        // req.query.categories.split(',') will return an array
        if (req.query.categories){
            filter = { category: req.query.categories.split(',')};
        }
        // Use .populate() to get detailed info for an ObjectId field by linking the ObjectId field to a table
        const products = await Product.find(filter).populate('category').sort({'name': 1});
        if (!products) {
            return res.status(500).json({success: false, error: 'Unable to get products', data: null});
        }
        return res.status(200).json({success: true, message: products.length==0? 'No products': 'Products found', data: products});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get an Existing Product by id
// Postman GET Request: http://localhost:3000/api/v1/products/63cf1b67a72e858ebc611fd3
router.get('/:id', async (req,res)=>{

    try {
        // Use .populate() to get detailed info for an ObjectId field by linking an ObjectId field to a table
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(500).json({success: false, error: 'Unable to get product with this id', data: null});
        }
        return res.status(200).json({success: true, message: 'Product with this id has been found', data: product});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Post a new Product
// Postman POST Request: http://localhost:3000/api/v1/products with 'Body' -> 'Raw' -> 'JSON'
// All JSON field names must be quoted or Postman will return Syntax Error
router.post('/', uploadOptions.single('image'), async (req,res)=>{ 
    
    try {
        // Check to be sure the category id is valid 
        const category = await Category.findById(req.body.category);
        if (!category){
            return res.status(400).json({success: false, error: 'This category id is invalid', data: null});
        }
        // Check to be sure the image file exists
        if (!req.file) {
            return res.status(400).json({success: false, error: 'Missing Product Image', data: null});
        }
        // If you get a MongoDB server error saying user is not allowed to do action [insert]
        // then you need to go inside MongoDB and then "Security" -> "Database Access" -> "Edit" the user 
        // -> "Database User Privileges" -> "Built-In Role" -> "Read and Write to Any Database"
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            // The filename is from the filename function above; 
            // but we need to build a full path like this so that client side can access it
            // http://localhost:3000/public/uploads/image123456.jpeg 
            image: `${req.protocol}://${req.get('host')}/public/uploads/${req.file.filename}`,  
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        });

        // Once the product is saved, Studio 3T 'products' will show 'image' field contains a full path
        const savedProduct = await product.save();
        if (!savedProduct){
            return res.status(400).json({success: false, error: 'Unable to post this product', data: null});
        }
        return res.status(201).json({success: true, message: 'This product has been posted', data: savedProduct})
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Update an Existing Product by id
// Postman PUT Request: http://localhost:3000/api/v1/products/63cf1b67a72e858ebc611fd3
router.put('/:id', uploadOptions.single('image'), async (req,res)=>{

    try {
        // Check to see if the product id is valid
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).json({success: false, error: 'This product id is invalid', data: null});
        }
        // Check to see if the category id is valid
        const category = await Category.findById(req.body.category);
        if (!category){
            return res.status(400).json({success: false, error: 'This category id is invalid', data: null});
        }
        // Check to be sure the image file exists
        if (!req.file) {
        return res.status(400).json({success: false, error: 'Missing Product Image', data: null});
        }
        // Must use {new: true} to return the updated category to the 'product' variable
        const product = await Product.findByIdAndUpdate(req.params.id, 
            {
                name: req.body.name,
                description: req.body.description,
                richDescription: req.body.richDescription,
                image: `${req.protocol}://${req.get('host')}/public/uploads/${req.file.filename}`,  
                brand: req.body.brand,
                price: req.body.price,
                category: req.body.category,
                countInStock: req.body.countInStock,
                rating: req.body.rating,
                numReviews: req.body.numReviews,
                isFeatured: req.body.isFeatured,
            }, {new: true});
        if (!product){
            return res.status(400).json({success: false, error: 'Unable to update this product', data: null});
        }
        return res.status(200).json({success: true, message: 'This product has been updated', data: product});
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null});
    }
});

// Delete an Existing Product by id
// Postman DELETE Request: http://localhost:3000/api/v1/products/63cf1e2de6c232737a0903e5
router.delete('/:id', async (req,res)=>{

    try {
        // Check to see if the product id is valid
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).json({success: false, error: 'This product id is invalid', data: null});
        }
        const product = await Product.findByIdAndRemove(req.params.id);
        if (!product){
            return res.status(404).json({success: false, error: 'Unable to find and delete this product', data: null});
        }
        return res.status(200).json({success: true, message: 'This product has been deleted', data: product});
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null});
    }
});

// Get Count of Products
// Postman GET Request: http://localhost:3000/api/v1/products/get/count
router.get('/get/count', async (req,res)=>{

    try {
        const count = await Product.countDocuments(); 
        if (!count) {
            return res.status(500).json({success: false, error: 'Unable to get count of products', data: null});
        }
        return res.status(200).json({success: true, message: 'Count of products has been generated', data: {count: count}});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get a List of Featured Products
// Useful in products page showing only a limited number of featured products
// Postman GET Request: http://localhost:3000/api/v1/products/get/featured/5
router.get('/get/featured/:count', async (req,res)=>{

    try {
        // req.params.count is a string and .limit() is expecting a number
        // so we have to add a '+' to the count to make it a number
        const count = req.params.count? req.params.count: 0;
        const featuredProducts = await Product.find({isFeatured: true}).populate('category').limit(+count);
        if (!featuredProducts) {
            return res.status(500).json({success: false, error: 'Unable to get featured products', data: null});
        }
        return res.status(200).json({success: true, message: 'Featured products have been generated', data: featuredProducts});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Upload Images Gallery by Updating (Normally this is done after a product is created)
router.put('/gallery-images/:id', uploadOptions.array('images',15), async (req,res)=>{

        // Check to see if the product id is valid
        if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).json({success: false, error: 'This product id is invalid', data: null});
        }
        // The product schema, 'images' field is an array of strings
        let imagePaths = [];
        if (req.files){
            req.files.map(file=>{
                imagePaths.push(`${req.protocol}://${req.get('host')}/public/uploads/${file.filename}`);
            });
        } 
        // Update gallery images
        const product = await Product.findByIdAndUpdate(req.params.id, { images: imagePaths}, {new: true});
        if (!product){
            return res.status(400).json({success: false, error: 'Unable to update gallery images for this product', data: null});
        }
        return res.status(200).json({success: true, message: 'This product gallery images have been updated', data: product});
});


// No need to have error handler here or multor callback with error won't show
// This happens when you upload an invalid file such as a pdf to the server, 
// multor should show 'Invalid Image Type' error message.

// router.use((err, req, res, next) => {
//     // console.error(err.stack);
//     return res.status(500).send({success: false, error: err});
// });

module.exports = router;

/* 
 use 'return' in all async functions to avoid getting a Mongoose HeaderError 
 that happens when attempting to send multiple responses for a request.
 https://stackoverflow.com/questions/7042340/error-cant-set-headers-after-they-are-sent-to-the-client
 
 */