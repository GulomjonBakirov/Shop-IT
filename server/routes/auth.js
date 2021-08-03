const express = require("express");
const crypto = require("crypto");

//Models
const User = require("../models/user");
const getResetPasswordToken = require("../models/user");
const comparePassword = require("../models/user");

//Utils file
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
//Middlewares
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { isAuthanticated, authorizeRoles } = require("../middlewares/auth");
// const { resolveHostname } = require("nodemailer/lib/shared");
const cloudinary = require("cloudinary");

const router = express.Router();
//register user => /api/v1/register
router.post(
  "/register",
  catchAsyncErrors(async (req, res, next) => {
    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "users",
      width: 150,
      crop: "scale",
    });

    const { name, email, password } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });

    sendToken(user, 200, res);
  })
);

// Login user => api/v1/login

router.post(
  "/login",
  catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    //Checks if email and password is enetered by user
    if (!email || !password) {
      return next(new ErrorHandler("please enter email & password", 400));
    }

    //Finding in db
    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Valid email or password"), 401);
    }

    //Checks if password is correct or not
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return next(new ErrorHandler("Valid email or password"), 401);
    }

    sendToken(user, 200, res);
  })
);

// Logout user => api/v1/logout
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  })
);

// Forgot Password => api/v1/password/forgot

router.post(
  "/password/forgot",
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return next(new ErrorHandler("USer not found with this email"), 404);
    }
    //Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({
      validateBeforeSave: false,
    });

    // Create reset password url
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/password/reset/${resetToken}`;

    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requeseted this email, then ignore it.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "ShopIT Password Recovery",
        message,
      });
      res.status(200).json({
        succes: true,
        message: `Email sent to: ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({
        validateBeforeSave: false,
      });
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Reset Password => api/v1/password/reset/:token

router.put(
  "/password/reset/:token",
  catchAsyncErrors(async (req, res, next) => {
    // Hash url token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return next(
        new ErrorHandler(
          "Password reset token is invalid or has been expired",
          400
        )
      );
    }

    if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password does not match", 400));
    }

    //Setup new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
  })
);

// Get currently logged in user details => /api/v1/me
router.get(
  "/me",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  })
);

//Update / Change passowrd => /api/v1/password/update
router.put(
  "/password/update",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    //Check previus password
    const isMatched = await user.comparePassword(req.body.oldPassword);

    if (!isMatched) {
      return next(new ErrorHandler("Old password i incorrect", 400));
    }

    user.password = req.body.password;

    await user.save();

    sendToken(user, 200, res);
  })
);

// Update user profile => /api/v1/me/update
router.put(
  "/me/update",
  isAuthanticated,
  catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
    };

    // Update avatar: TODO
    if (req.body.avatar !== "") {
      const user = await User.findById(req.user.id);

      const image_id = user.avatar.public_id;
      const res = await cloudinary.v2.uploader.destroy(image_id);

      const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "users",
        width: 150,
        crop: "scale",
      });

      newUserData.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
    });
  })
);
// Logout user => api/v1/logout
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  })
);

//Get all users  => /api/v1/admin/users
router.get(
  "/admin/users",
  isAuthanticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const users = await User.find().sort("name");

    res.status(200).json({
      success: true,
      users,
    });
  })
);

// Get user details => /api/v1/admin/user/:id
router.get(
  "/admin/user/:id",
  isAuthanticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorHandler(`User does not found with id : ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      user,
    });
  })
);

// Update user profile => /api/v1/admin/user/:id
router.put(
  "/admin/user/:id",
  isAuthanticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    };

    // Update avatar: TODO

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    if (!user) {
      return next(
        new ErrorHandler(`User does not found with id : ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
    });
  })
);

// Delete user => /api/v1/admin/user/:id
router.delete(
  "/admin/user/:id",
  isAuthanticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorHandler(`User does not found with id : ${req.params.id}`, 404)
      );
    }

    await user.remove();

    res.status(200).json({
      success: true,
    });
  })
);

module.exports = router;
