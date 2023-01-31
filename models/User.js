const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    street: {
        type: String,
        default: '',
    },
    apartment: {
        type: String,
        default: '',
    },
    zip: {
        type: String,
        default: '',
    },
    city: {
        type: String,
        default: '',
    },
    country: {
        type: String,
        default: ''
    }
});

// Mongoose allows you to create virtual prperties that are not stored in the database, 
// they just get populated at run time. So any time toJSON is called on the model you create 
// from this schema, it will include an 'id' that matches the _id that Mongodb generates. 

// Duplicate the ID field.
// UserSchema.virtual('id').get(function(){
//     return this._id.toHexString();
// });

// // Ensure virtual fields are serialised.
// UserSchema.set('toJSON', {
//     virtuals: true
// });

exports.User = mongoose.model('User', UserSchema);