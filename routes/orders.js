const express = require('express');
const router = express.Router();
const { Order} = require('../models/Order');
const { OrderItem } = require('../models/OrderItem');

// Get all Orders
// Postman GET Request: http://localhost:3000/api/v1/orders/

// How to populate orderItems to include products?
// Method 1: Use .populate('orderItems') to show detailed order itmes like this:
// "orderItems": [
// {
//     "_id": "63d1991553a295e76896c164",
//     "quantity": 2,
//     "product": "63cf1b67a72e858ebc611fd3",
//     "__v": 0
// },
// {
//     "_id": "63d1991553a295e76896c165",
//     "quantity": 2,
//     "product": "63cf1dc8e6c232737a0903e2",
//     "__v": 0
// }
// ]

// Method 2: Use .populate({  
//     path: 'orderItems', populate: { path: 'product', model: 'Product', select: { '_id': 1, 'name': 1, 'description': 1}, 
//     populate: { path: 'category', model: 'Category', select: { '_id': 1, 'name': 1}}}
// }) to show selected field from Product and Category tables
// "orderItems": [
//     {
//         "_id": "63d1991553a295e76896c164",
//         "quantity": 2,
//         "product": {
//             "_id": "63cf1b67a72e858ebc611fd3",
//             "name": "Product 1",
//             "description": "Product 1 Description",
//             "category": {
//                 "_id": "63ceed5ab00556b8c16ec547",
//                 "name": "Category 10 Updated"
//             }
//         },
//         "__v": 0
//     },
//     {
//         "_id": "63d1991553a295e76896c165",
//         "quantity": 2,
//         "product": {
//             "_id": "63cf1dc8e6c232737a0903e2",
//             "name": "Product 2",
//             "description": "Product 2 Description",
//             "category": {
//                 "_id": "63ceeeccba4e09ac7d7ff5b5",
//                 "name": "Category 20 Updated*"
//             }
//         },
//         "__v": 0
//     }
// ]

// Get all Orders
// Postman GET Request: http://localhost:3000/api/v1/orders
router.get('/', async (req,res)=>{

    try {
        const allOrders = await Order.find()
        .select('-shippingAddress1 -shippingAddress2 -city -zip -country') // Exclude fields from Order table
        .populate('user', 'name') // Only populate the 'name' of the user
        .populate({   // Populate 'orderItems with selected fields from Product & Category tables
            path: 'orderItems',
            populate: { 
            path: 'product', 
            model: 'Product', 
            select: { '_id': 1, 'name': 1, 'description': 1}, 
            populate: { path: 'category', model: 'Category', select: { '_id': 1, 'name': 1}}}
        })
        .sort({'dateOrdered': -1});  // Sort by descending 'dateOrdered'

        if (!allOrders) {
            return res.status(500).json({success: false, error: 'Unable to get orders', data: null});
        }
        return res.status(200).json({success: true, message: allOrders.length==0? 'No orders': 'Orders found', data: allOrders});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get an Existing Order by id
// Postman GET Request: http://localhost:3000/api/v1/orders/63d1aa207f128e73e0d6b629
router.get('/:id', async (req,res)=>{

    try {
        // Populate selected fields from Product & Category tables
        // Populate only 'name' field from User table 
        // ( I used Studio 3T to insert a new user 'user 1' into User table before I have a chance
        // to work on the Users routes. )
        // No need to sort by 'dateOrdered' because we are getting only the order that matches the id
        const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({  
            path: 'orderItems',
            populate: { 
            path: 'product', 
            model: 'Product', 
            select: { '_id': 1, 'name': 1, 'description': 1}, 
            populate: { path: 'category', model: 'Category', select: { '_id': 1, 'name': 1}}}
        });
    

        if (!order) {
            return res.status(500).json({success: false, error: 'Unable to get order with this id', data: null});
        }
        return res.status(200).json({success: true, message: 'Order with this id has been found', data: order});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Post a new Order
// Postman POST Request: http://localhost:3000/api/v1/orders with 'Body' -> 'Raw' -> 'JSON'
// All JSON field names must be quoted or Postman will return Syntax Error
router.post('/', async (req,res)=>{

    try {
        // Table Structure:
        // Every Order has an 'orderItems' array of ObjectIds that link to OrderItem table
        // Every OrderItem has 'quantity' and 'product' properties. The 'product' is an ObjectId
        // that links to Product table.

        // Posting a new Order involves 2 steps:
        // Adding every order item to OrderItem table first to get the saved order item ids 
        // then add these saved order item ids to Order table. So upon successful saving
        // of a new Order, the 'orderItems' array will consists of an array of ObjectIds
        // that link to OrderItem table.
      
        // By referencing the req.body.orderItems, we have access to the array of objects
        // that is passed from Postman. Looping through this array to add each order item 
        // to OrderItem table.

        // So the Order JSON POSTed from Postman should look like this:
        // {
        //     "orderItems" : [
        //         { "quantity": 3, "product" : "5fcfc406ae79b0a6a90d2585" },
        //         { "quantity": 2, "product" : "5fd293c7d3abe7295b1403c4" }
        //      ],
        //     "shippingAddress1" : "Flowers Street , 45",
        //     "shippingAddress2" : "1-B",
        //     "city": "Prague",
        //     "zip": "00000",
        //     "country": "Czech Republic",
        //     "phone": "+420702241333",
        //     "user": "5fd51bc7e39ba856244a3b44"
        // }

        // Use await Promise.all() to return an array of savedOrderItem._id
        // The .map() is a higher-order function that takes another function as an argument
        // The 'orderItem' is an object of { quantity, ??, product: <ObjectId> }
        const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem)=>{
            const newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product,
            });
            const savedOrderItem = await newOrderItem.save();
            return savedOrderItem._id;
        }));
  
        // Console Debug: orderItemsIds: [ new ObjectId("..."), new ObjectId("...") ]
 
        // Calculate Total Price by looping through orderItemsIds to look up product price
        const subtotals = await Promise.all(
            orderItemsIds.map(async (id)=>{

                // Console Debug: item:
                // { _id: new ObjectId("63d0aef0bfd810f63c9cf98e"),
                //   quantity: 2, 
                //   product: { _id: new ObjectId("63cf1b67a72e858ebc611fd3"), price: 10 }, __v: 0 }

                let subtotal = 0;
                const item = await OrderItem.findById(id).populate('product', 'price');  // only need the price
                if (item){
                    subtotal = item.quantity * item.product.price;
                    return subtotal;
                }
             }) // do not add a semi-colon here or get error and is difficult to see
        );
 
        // Calculate total price by summing up subtotals
        const totalPrice = subtotals.reduce((a,b) => a + b, 0);

        // Add Order with orderItemsIds ( an array of ObjectIds ) for 'orderItems' and totalPrice
        const order = new Order({
            "orderItems": orderItemsIds,
            "shippingAddress1": req.body.shippingAddress1,
            "shippingAddress2": req.body.shippingAddress2,
            "city": req.body.city,
            "zip": req.body.zip,
            "country": req.body.country,
            "phone": req.body.phone,
            "status": req.body.status,
            "totalPrice": totalPrice,
            "user": req.body.user,
        });

        // Upon successful order.save(), 'orderItems' should look like: "orderItems": [ "...", "..." ],
        const savedOrder = await order.save();
        if (!savedOrder){
            return res.status(400).json({success: false, error: 'Unable to post this order', data: null});
        }
        return res.status(201).json({success: true, message: 'This order has been posted', data: savedOrder})
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Update Status of an Existing Order by id 
// Useful for Admin to update order status from 'Pending' to 'Shipped' or 'Delivered'
// Postman PUT Request: http://localhost:3000/api/v1/orders/63d1aa207f128e73e0d6b629
router.put('/:id', async (req,res)=>{

    try {
        // Must use {new: true} to return the updated order to the 'order' variable
        const order = await Order.findByIdAndUpdate(req.params.id, { 'status': req.body.status }, {new: true});
        if (!order){
             return res.status(400).json({success: false, error: 'Unable to update status for this order', data: null});
        }
        return res.status(200).json({success: true, message: 'The status for this order has been updated', data: order});
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null});
    }
});

// Delete an Existing Order by id
// Delete an existing order involves deleting order items for the order, then delete the order itself
// Postman DELETE Request: http://localhost:3000/api/v1/orders/63d1aa207f128e73e0d6b629
router.delete('/:id', async (req,res)=>{

    try {
        const order = await Order.findByIdAndRemove(req.params.id);
        if (!order){
            return res.status(404).json({success: false, error: 'Unable to find and delete this order', data: null});
        } else {
            // Delete order item by looping through orderItems array which is an array of ids
            order.orderItems.map(async (id)=>{
                await OrderItem.findByIdAndRemove(id);
            });
            // At this point all order items for the order have been deleted
            return res.status(200).json({success: true, message: 'This order has been deleted', data: order});
        }
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null});
    }
});

// Get Count of Order
// Postman GET Request: http://localhost:3000/api/v1/orders/get/count
// The route must be '/get/count', not '/getcount' or MongoDB will return an ObjectId Cast Error
// because it is trying to cast what is after '/orders' as an ObjectId that is needed when getting
// a single order by providing an id params.
router.get('/get/count', async (req,res)=>{
    
    try {
        const count = await Order.countDocuments(); 
        if (!count) {
            return res.status(500).json({success: false, error: 'Unable to get count of orders', data: null});
        }
        return res.status(200).json({success: true, message: 'Count of orders has been generated', data: {count: count}});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get Total Sales of Orders
// Postman GET Request: http://localhost:3000/api/v1/orders/get/totalsales
router.get('/get/totalsales', async (req,res)=>{

    try {
        // MongoDB aggregate takes an array of pipilines: db.collection.aggregate(pipeline, options);
        // We are summing up the 'totalPrice' field of all orders
        // The .aggregate() must be in lower case or it won't work
        // Must include '_id' because MongoDb won't return an object without an _id
        const totalsales= await Order.aggregate([
            {$group: { _id: 0, totalsales: {$sum: '$totalPrice'}}}
        ]);
        if (!totalsales) {
            return res.status(500).json({success: false, error: 'Unable to get totalsales of orders', data: null});
        }

        // Console Debug: 'totalsales': [ { _id: 0, totalsales: 60 } ] is an array consisting only one object
        // Use array.pop() to get this object, then get the value of 'totalsales' property 
        // So the final result with totalsales.pop().totalsales will return this:
        // {
        //     "success": true,
        //     "message": "The totalsales of orders has been generated",
        //     "data": {
        //         "totalsales": 60
        //     }
        // }

        return res.status(200).json({success: true, message: 'The totalsales of orders has been generated', data: {totalsales: totalsales.pop().totalsales}});
    } catch (err){
        return res.status(500).json({success: false, error: err, data: null})
    }
});

// Get all the Orders for an User by user id
// Use Order.find(<filter object>) to filter only orders for this user
// Postman GET Request: http://localhost:3000/api/v1/orders/get/orders/63d1a89f5938f95a0677c1ef
router.get('/get/orders/:userid',async (req, res)=>{

    try{
        const orders = await Order.find({'user': req.params.userid});
        if(!orders){
            return res.status(400).json({success: false, error: 'Unable to get orders for this user', data: null})
        }
        return res.status(200).json({success: true, message: 'Orders found for this user', data: orders});
    } catch (err) {
        return res.status(500).json({success: false, error: err, data: null});
    }

});

// Error Handler
router.use((err, req, res, next) => {
    // console.error(err.stack);
    return res.status(500).send({success: false, error: err});
});

module.exports = router;