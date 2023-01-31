const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    color: { // this could be a hex color #000 for black
        type: String,
    },
    icon: { // this could be a google material icon svg
        type: String,
    }
});

// Export category as an object
exports.Category = mongoose.model('Category', CategorySchema);