const express = require('express');
const router = express.Router();
const { Category } = require('../models/Category');

// Get all Categories
// Postman GET Request: http://localhost:3000/api/v1/categories/
router.get('/', async (req,res)=>{

    try {
        // Return result in ascending category name order
        const allCategories = await Category.find().sort({'name': 1});  
        if (!allCategories) {
            return res.status(500).json({success: false, error: 'Unable to get categories', data: null});
        }
        return res.status(200).json({success: true, message: allCategories.length==0? 'No categories': 'Categories found', data: allCategories});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get an Existing Category by id
// Postman GET Request: http://localhost:3000/api/v1/categories/63ceed5ab00556b8c16ec547
router.get('/:id', async (req,res)=>{

    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(500).json({success: false, error: 'Unable to get category with this id', data: null});
        }
        return res.status(200).json({success: true, message: 'Category with this id has been found', data: category});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Post a new Category
// Postman POST Request: http://localhost:3000/api/v1/categories with 'Body' -> 'Raw' -> 'JSON'
// All JSON field names ("name", "color", "icon") must be quoted or Postman will return Syntax Error
router.post('/', async (req,res)=>{

    try {
        const category = new Category(req.body);
        const savedCategory = await category.save();
        if (!savedCategory){
            return res.status(400).json({success: false, error: 'Unable to post this category', data: null});
        }
        return res.status(201).json({success: true, message: 'This category has been posted', data: savedCategory})
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Update an Existing Category by id
// Postman PUT Request: http://localhost:3000/api/v1/categories/63ceed5ab00556b8c16ec547
router.put('/:id', async (req,res)=>{

    try {
        // Must use {new: true} to return the updated category to the 'category' variable
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!category){
            return res.status(400).json({success: false, error: 'Unable to update this category', data: null});
        }
        return res.status(200).json({success: true, message: 'This category has been updated', data: category});
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null});
    }
});

// Delete an Existing Category by id
// Postman DELETE Request: http://localhost:3000/api/v1/categories/63cef1da50d4634d3972c443
router.delete('/:id', async (req,res)=>{

    try {
        const category = await Category.findByIdAndRemove(req.params.id);
        if (!category){
            return res.status(404).json({success: false, error: 'Unable to find and delete this category', data: null});
        }
        return res.status(200).json({success: true, message: 'This category has been deleted', data: category});
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null});
    }
});

// Get Count of Categories
// Postman GET Request: http://localhost:3000/api/v1/categories/get/count
// The route must be '/get/count', not '/getcount' or MongoDB will return an ObjectId Cast Error
// because it is trying to cast what is after '/categories' as an ObjectId that is needed when getting
// a single category by providing an id params.
router.get('/get/count', async (req,res)=>{
    
    try {
        const count = await Category.countDocuments(); 
        if (!count) {
            return res.status(500).json({success: false, error: 'Unable to get count of categories', data: null});
        }
        return res.status(200).json({success: true, message: 'Count of categories has been generated', data: {count: count}});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Error Handler
router.use((err, req, res, next) => {
    // console.error(err.stack);
    return res.status(500).send({success: false, error: err});
});

// Export as a module
module.exports = router;

/* An object is returned to the client based on the success or failure/error of the request.

{ success: true,
  message: 'success message',
  data: <data> }

{ success: false,
  error: 'error message' or err
  data: null }

 */

