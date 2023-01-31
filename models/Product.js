const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    richDescription: {
        type: String,
        default: '',
    },
    image: { // this is the main photo
        type: String,
        default: '',
    },
    images: [{ // this is an array of gallery photos
        type: String
    }],
    brand: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        default: 0
    },
    category: { // this field contains an ObjectId
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 255,
    },
    rating: {
        type: Number,
        default: 0,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    }, 
    
    // If you pass Date.now as the default in your mongoose schema, 
    // you are passing the function and mongoose will call that function 
    // every time a document needs a default value for that property. 
    // This results in the current time, at the time of document creation, 
    // being stored as the value for that property.

    // If you pass Date.now() instead, you are passing the value returned by Date.now() 
    // rather than the function. By doing this, your documents will get the current time, 
    // at the time of schema creation, as the default value for that property. 
    // This is probably not what you want.

    dateCreated: {
        type: Date,
        default: Date.now,  // this is a JavaScript function
    }
});

// Export product as an object
exports.Product = mongoose.model('Product', ProductSchema);