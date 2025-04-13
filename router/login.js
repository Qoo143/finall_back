//--------------------<<導入區>>-------------------------

const express = require('express')
const router = express.Router()
const loginControllers = require('../router_controllers/loginController');

//--------------------<<路由區>>-------------------------

router.post('/regist', loginControllers.regist)
router.post('/login', loginControllers.login)

//--------------------<<導出>>-------------------------

module.exports = router