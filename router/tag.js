const express = require('express')
const router = express.Router()
const tagController = require('../router_controllers/tagController')

// 新增標籤
router.post('/', tagController.createTag)//單筆新增標籤
router.post('/patch', tagController.createTagsInBatch)//批次新增標籤

// 查詢全部標籤
router.get('/', tagController.getAllTags)

// 修改標籤
router.put('/:id', tagController.updateTag)

// 刪除標籤
router.delete('/:id', tagController.deleteTag)

module.exports = router
