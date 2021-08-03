const Product = require('../models/product')
const dotenv = require('dotenv')
const connectDatabase = require('../config/database')

const products = require('../data/product.json')

dotenv.config({
  path: 'server/config/config.env'
})

connectDatabase();
const seedProducts = async () => {
  try {

    await Product.deleteMany();
    console.log('Products are deleted')

    await Product.insertMany(products)
    console.log('All Products are added')

    process.exit()
  } catch (err) {
    console.log(err.message)
    process.exit()
  }
}

seedProducts()