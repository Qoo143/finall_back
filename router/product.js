//--------------------<<導入區>>-------------------------

const express = require('express')
const router = express.Router()
const productsControllers = require('../router_controllers/productController')
const upload = require('../middleware/upload');

//--------------------<<一般路由區>>-------------------------

//增
router.post('/', productsControllers.createProduct);//新增單一商品
//刪
router.delete('/:id', productsControllers.deleteProductById);//刪除單一商品
//修
router.put('/:id', upload.any(), productsControllers.updateProductById);//編輯單一商品
//查
router.get('/', productsControllers.getProductsByFilter);//查商品(進階篩選)
router.get('/:id', productsControllers.getProductById);//查單一商品

//--------------------<<導出>>-------------------------

module.exports = router