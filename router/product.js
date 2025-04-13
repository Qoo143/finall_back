//--------------------<<導入區>>-------------------------

const express = require('express')
const router = express.Router()
const productsControllers = require('../router_controllers/productController')
const imageUpload = require("../middleware/imageUploader");//上傳圖片設定
const modelUpload = require("../middleware/modelUploader");//上傳模型設定

//--------------------<<一般路由區>>-------------------------

//增
router.post('/', productsControllers.createProduct);//新增商品
//刪
router.delete('/:id', productsControllers.deleteProductById);//刪除商品
router.delete('/:productId/images/:imageId', productsControllers.deleteProductImage);//刪除商品圖片

//修
router.put('/:productId/images/:imageId/main', productsControllers.setMainImage);//設定主圖 API
//查
router.get('/', productsControllers.getAllProducts);//查全部商品
router.get('/:id', productsControllers.getProductById);//查單一商品
router.get('/:id/images', productsControllers.getProductImages);//查商品2D圖片
router.get('/:id/model', productsControllers.getProductModel);//查商品3D模型


//--------------------<<圖片路由區>>-------------------------

router.post(
  "/:id/upload-model",
  modelUpload.fields([
    { name: "obj", maxCount: 1 },//模型(一定要搭mtl)
    { name: "mtl", maxCount: 1 },//材質
    { name: "thumbnail", maxCount: 1 }//靜態預設圖
  ]),
  productsControllers.upload3DModel
);// 上傳商品3D模型+3D貼圖+預覽主圖
router.post(
  "/:id/images",
  imageUpload.array("images", 10), // 10 張圖為限，欄位名應為 images
  productsControllers.uploadProductImages
);//上傳商品2D圖片(輔助)

//--------------------<<導出>>-------------------------

module.exports = router