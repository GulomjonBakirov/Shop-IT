const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyparser = require("body-parser");
const fileUpload = require("express-fileupload");
const errorMiddleware = require("./middlewares/errors");
// const dotenv = require("dotenv");
const path = require("path");
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "server/config/config.env",
  });
}

//router
const products = require("./routes/product");
const auth = require("./routes/auth");
const orders = require("./routes/order");
const payment = require("./routes/payment");

app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());

//ROUTes
app.use("/api/v1", products);
app.use("/api/v1", auth);
app.use("/api/v1", orders);
app.use("/api/v1", payment);

if (process.env.NODE_ENV === "PRODUCTION") {
  const path = require("path");
  let root = path.join(__dirname, "..", "client/build/");
  app.use(express.static(root));
  app.use(function (req, res, next) {
    if (
      req.method === "GET" &&
      req.accepts("html") &&
      !req.is("json") &&
      !req.path.includes(".")
    ) {
      res.sendFile("index.html", { root });
    } else next();
  });
}

// Middleware to handle errors
app.use(errorMiddleware);

module.exports = app;
