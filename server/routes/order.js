const express = require("express");

//Middleware
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { isAuthanticated, authorizeRoles } = require("../middlewares/auth");
//models
const Order = require("../models/order");
const Product = require("../models/product");

//Utils
const ErrorHandler = require("../utils/errorHandler");
const order = require("../models/order");

const router = express.Router();

//Create a new order => /api/v1/order/new
router.post(
  "/order/new",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    const {
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
    } = req.body;

    const order = await Order.create({
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
      paidAt: Date.now(),
      user: req.user._id,
    });
    res.status(200).json({
      success: true,
      order,
    });
  })
);

// Get single order => api/v1/order/:id

router.get(
  "/order/:id",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return next(
        new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      order,
    });
  })
);

// Get logged in users order => /api/v1/order/me

router.get(
  "/orders/me",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({
      user: req.user.id,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  })
);

//Get all Orders - Admin order => /api/v1/admin/orders
router.get(
  "/admin/orders",
  isAuthanticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });

    res.status(200).json({
      success: true,
      totalAmount,
      orders,
    });
  })
);

//Update Order - Admin order => /api/v1/admin/order/:id
router.put(
  "/admin/order/:id",
  isAuthanticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (order.orderStatus === "Delivered") {
      return next(new ErrorHandler(`You have already deliver this order`, 400));
    }

    order.orderItems.forEach(async (item) => {
      await updateStock(item.product, item.quantity);
    });

    order.orderStatus = req.body.status;
    order.deliveredAt = Date.now();

    await order.save();

    res.status(200).json({
      success: true,
    });
  })
);

//Delete order => /api/v1/admin/order/:id
router.delete(
  "/admin/order/:id",
  isAuthanticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return next(
        new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404)
      );
    }

    await order.remove();

    res.status(200).json({
      success: true,
    });
  })
);

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.stock = product.stock - quantity;

  await product.save({
    validateBeforeSave: false,
  });
}

module.exports = router;
