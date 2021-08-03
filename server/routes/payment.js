const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { isAuthanticated } = require("../middlewares/auth");

const ErrorHandler = require("../utils/errorHandler");

const router = express.Router();

//process stripe payments => /api/v1/payment/process

router.post(
  "/payment/process",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",

      metadata: {
        integration_check: "accept_a_payment",
      },
    });

    res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret,
    });
  })
);

//Send stripe api key => /api/v1/stripeapi

router.get(
  "/stripeapi",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({
      stripeApiKey: process.env.STRIPE_API_KEY,
    });
  })
);

module.exports = router;
