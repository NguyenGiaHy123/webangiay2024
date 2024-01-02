const express=require('express');
const Route=express.Router();
const conTrollerAdmin=require('../Controller/Admin');
const upload=require('../Middleware/cloudinaryConfig');
const {verifyAccessToken}=require('../helpers/jwt_helpers');


Route.delete('/delete_Product',verifyAccessToken,conTrollerAdmin.DELETE_PRODUCTS);
Route.post('/add_product',upload.array("poster"),verifyAccessToken,conTrollerAdmin.ADD_PRODUCTS);
Route.put('/update_product',upload.array("poster"),verifyAccessToken,conTrollerAdmin.UPDATE_PRODUCTS);
Route.get('/list_Product',verifyAccessToken,conTrollerAdmin.LIST_PRODUCTS);
Route.get('/getCommentUser',verifyAccessToken,conTrollerAdmin.AdminGetCommentUser);
Route.get('/Get_LIST_CART',verifyAccessToken,conTrollerAdmin.LIST_CART);
Route.get('/getAllCartAdmin',verifyAccessToken,conTrollerAdmin.LIST_CART_ALL_USER);
Route.get('/Get_Key_Product',verifyAccessToken,conTrollerAdmin.Get_KeyProduct);
Route.post('/LIST_CART_ID',verifyAccessToken,conTrollerAdmin.LIST_CART_ID);
module.exports=Route