const express = require('express');
const route = express.Router();
const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const middlewares = require('../middlewares/auth.middleware');
var nodemailer = require('nodemailer');
const fs = require('fs');
const { getMaxListeners } = require('process');
path = require('path');

// Create new order
route.post('/api/orders', middlewares.verifyToken, async function (req, res, next) {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    } else {
      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      })

      const createdOrder = await order.save();


      return res.status(201).json(createdOrder);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }

})

// Get all orders
route.get('/api/orders', [middlewares.verifyToken, middlewares.checkIsAdmin], async function (req, res, next) {
  try {
    const orders = await Order.find({}).populate('user', 'id name')
    return res.json(orders);
  } catch (error) {
    console.log(error);
    next(error);
  }

})

//Get order by ID
route.get('/api/orders/:id', [middlewares.verifyToken], async function (req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );
    return res.json(order);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: 'Order not found' });
  }

});

// Get logged in user orders
route.get('/api/myorders', [middlewares.verifyToken], async function (req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).exec();
    console.log(orders);
    return res.json(orders);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: 'Order not found' });
  }

});

// Accept order
route.patch('/api/orders/accept/:id', [middlewares.verifyToken, middlewares.checkIsAdmin], async function (req, res, next) {
  try {
    const isAccept = req.body.isAccept;
    const order = await Order.findById(req.params.id).populate('user');

    if (!order) {
      console.log(error);
      return res.status(404).json({ message: 'Order not found' });
    };

    for (i = 0; i < order.orderItems.length; i++){
      var proId = order.orderItems[i].product;
      const product = await Product.findById(proId);
      console.log('id', proId);
      product.countInStock = product.countInStock - order.orderItems[i].qty;
      await product.save();
    }

    order.isAccept = isAccept;
    await order.save();

    var orderId = order._id;
    var totalPrice = order.orderItems.reduce(function (previous, current) {
      return previous + current.qty * current.price;
    }, 0);
    var quantity = order.orderItems.length;
    var shippingPrice = order.shippingPrice;
    var taxPrice = order.taxPrice;
    var total = order.totalPrice;
    var address = order.shippingAddress.address;
    var city = order.shippingAddress.city;
    var postalCode = order.shippingAddress.postalCode;
    var country = order.shippingAddress.country;
    var date = new Date();
    var estimatedDate = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'heocute10899@gmail.com',
        pass: 'ngocquyettam'
      }
    });
    
     const user = await User.findOne({_id: order.user});
    console.log(order);

    var mailOptions = {
      from: 'heocute10899@gmail.com',
      to: user.email,
      subject: 'Sending Email using Node.js',
      html: fs.readFileSync(path.join(__dirname, '../view/mail_accept_order.html'), 'utf-8')
        .replace('{orderId}', orderId)
        .replace('{quantity}', quantity)
        .replace('{totalPrice}', totalPrice)
        .replace('{shippingPrice}', shippingPrice)
        .replace('{taxPrice}', taxPrice)
        .replace('{total}', total)
        .replace('{address}', address)
        .replace('{city}', city)
        .replace('{postalCode}', postalCode)
        .replace('{country}', country)
        .replace('{estimatedDate}', estimatedDate)

    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Accepted order successfully' });

  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: 'Order not found' });
  }

})

//   Admin Update order to delivered & paid
route.patch('/api/orders/:id/deliver_paid', [middlewares.verifyToken, middlewares.checkIsAdmin], async function (req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    order.isDelivered = req.body.isDelivered;

    if(req.body.isDelivered){
      order.deliveredAt = Date.now();
    }
   
    if(req.body.isPaid){
      order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();

    return res.json(updatedOrder);
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: 'Order not found' });
  }

});



module.exports = route;