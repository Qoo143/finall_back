const express = require('express');
const router = express.Router();
const productCategoryController = require('../router_controllers/productCategoryController');
const multer = require('multer');

const upload = multer({ dest: 'temp/' });
// ✅ 取得所有分類
router.get('/', productCategoryController.getAllCategories);

// ✅ 利用id取得分類
router.get('/:id', productCategoryController.getCategoryById);

// ✅ 新增分類
router.post('/', productCategoryController.createCategory);

// ✅ 更新分類
router.put('/:id', productCategoryController.updateCategory);

// ✅ 刪除分類（需無子分類）
router.delete('/:id', productCategoryController.deleteCategory);

// ✅ 上傳 icon 圖示（欄位名為 icon）
router.post('/upload-icon', upload.single('icon'), productCategoryController.uploadIcon);

module.exports = router;

