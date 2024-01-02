const { json } = require("body-parser")
const { request } = require("express")
const User=require('../Modal/User')
const Product=require('../Modal/Products')
const Comment=require('../Modal/Comment')
const cloudinary=require('cloudinary')
const Cart=require('../Modal/Carts')
const { default: mongoose } = require('mongoose');
const fs = require('fs')
const { array } = require("../Multer/multer")
class controlAdmin{
   async  DELETE_PRODUCTS(rq,rs){
    try{
        const {id}=rq.body;
         
        
        const product=await Products.findByIdAndDelete(id);
        if(product){
            rs.status(200).json({
                id_Product:product._id,
            })
        }
        else{
            rs.status(400).json({
                message:'Xóa không thành công'
            })
        }
        
    }
    catch(err){
     }
    }

   async ADD_PRODUCTS(rq,rs){
    const {_id,role}=rq.data.id
    let pictureFiles = rq.files;
    const urls = [];
    const {name,size,price,sex,color,description,productType,collections,key,NSX,endow,quantity}=rq.body
    const user_Client= await User.findById(_id);
    if(user_Client.role!=1){
       return rs.status(400).json({
            message:"Chức năng này được sử dụng cho admin "
        })
    }
    
    let multiplePicturePromise = pictureFiles.map((picture) =>
    cloudinary.v2.uploader.upload(picture.path)
       
    
    );
    let imageResponses = await Promise.all(multiplePicturePromise);
   

    if(imageResponses){
        imageResponses.forEach((imageResponse) => {
            urls.push(imageResponse.secure_url);
      
        });
    }
    const newProduct=new Product({
        _id:new mongoose.Types.ObjectId(),
        name:name,
        size:size,
        price:price,
        NSX:NSX,
        sex:sex,
        color:color,
        poster:urls,
        description:description,
        collections:collections,
        key:key,
        endow,
        quantity,
        productType
    })
    
    const resultProduct=await newProduct.save();
    rs.status(200).json({
        message: 'image upload successful',
       product: resultProduct
      });

   }

   async UPDATE_PRODUCTS(rq,rs){
    const {_id,role}=rq.data.id
     let pictureFiles = rq.files;
    const urls = [];
    const user_Client= await User.findById(_id);

    if(user_Client.role!=1){
       return rs.status(400).json({
            message:"Chức năng này được sử dụng cho admin "
        })
    }
    
    const {name,size,price,sex,color,description,productType,collections,key,NSX,endow,quantity}=rq.body
    let multiplePicturePromise = pictureFiles.map((picture) =>
    cloudinary.v2.uploader.upload(picture.path));
    let imageResponses = await Promise.all(multiplePicturePromise);
    if(imageResponses){
        imageResponses.forEach((imageResponse) => {
            urls.push(imageResponse.secure_url);
          
        });
    }
    const newProduct={
        _id:new mongoose.Types.ObjectId(),
        name:name,
        size:size,
        price:price,
        NSX:NSX,
        sex:sex,
        color:color,
        poster:urls,
        description:description.trim(),
        collections:collections.trim(),
        key:key,
        endow,
        quantity,
        productType
    }
    const resultProductUpdate=await Product.findByIdAndUpdate({_id},newProduct,{new:true});
    rs.status(200).json({
        message: 'update successful',
        product: resultProductUpdate
      });
}
    async DELETE_PRODUCTS(rq,rs){
        const {_id}=rq.data.id
        const user_Client= await User.findById(_id);
        if(user_Client.role!=1){
           return rs.status(400).json({
                message:"Chức năng này được sử dụng cho admin "
            })
        }
        const {id}=rq.body;
        const product=await Product.findByIdAndDelete(id);
        if(product){
            rs.status(200).json({
                id_Product:product._id,
            })
        }
        else{
            rs.status(400).json({
                message:'Xóa không thành công'
            })
        }
        
    }

    async LIST_PRODUCTS(rq,rs){
        try{
            const {page,limit}=rq.body;
    console.log(page)
    const pageCurretn=parseInt(page);
    const limitCurrent=parseInt(limit);
    const listAllProduct=await Product.find().skip(pageCurretn*limitCurrent).limit(limitCurrent).sort('createdAt');;
    const listProductAndComment=[];
    for(let i=0;i<listAllProduct.length;i++){
        const listComment=await Comment.find({_id_product:listAllProduct[i]._id});
        listProductAndComment.push({product:listAllProduct[i],comment:listComment})
    }
    rs.status(200).json({
        page:pageCurretn,
        limit:limitCurrent,
        listProductAndComment:listProductAndComment.length
    })
    
        }catch(err){
            console.log(err)
        }
    }
        async AdminGetCommentUser(rq,rs){
            try{
                const {page,limit,_id_product}=rq.query;
                const {_id}=rq.data.id
                const user_Client= await User.findById(_id);
                if(user_Client.role!=1){
                   return rs.status(400).json({
                        message:"Chức năng này  được sử dụng cho admin "
                    })
                }
                const pageCurrtent=parseInt(page);
                const limitCurrent=parseInt(limit);
                const CommentAllUser=await Comment.find({_id_product:_id_product}).skip(pageCurrtent*limitCurrent).limit(limitCurrent).sort('timeComment');
                rs.status(200).json({
                    page:pageCurrtent,
                    limit:limitCurrent,
                    CommentAllUser:CommentAllUser
                })
            }
            catch(err){
                console.log(err)
            }
           
            
        }
      //----------------------------Cart----------------------------

      async MESSAGES_CART_ERROR (req, res) {
        try{
             


        }catch(err){
            console.log(err)
        }

      }

      async Delete_Cart (req, res) {
        try{
            const {_id}=req.data.id
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                      message:"Chức năng này được sử dụng cho admin "
                 })
                }
            const {id}=req.body;
            const cart=await Cart.findByIdAndDelete(id);
            if(cart){
                res.status(200).json({
                    id_Cart:cart._id,
                })
            }
        }catch(err){
            console.log(err)
        }
      }

      async CHECK_OUT_CARD (req, res) {
        try{


            
        }catch(err){
            console.log(err)
        }

      }


      async LIST_CART (req, res) {
        try{
            const{_id}=req.data.id;
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}

          const {success,status_order,page,limit}=req.query;
        
          const limitCurrent=parseInt(limit)||10;
          const pageCurrent=parseInt(page)||1;
          //  get order is approved success
          if(success=="true"&&status_order=="true"){
            const listCart_approved=await Cart.find({success:true,status_order:true}).skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
            const userCommentCart=[];
            for(let i=0;i<listCart_approved.length;i++){
                const user=await User.findById(listCart_approved[i]._id_user);
                userCommentCart.push({user:user,cart:listCart_approved[i]})
            }
            res.status(200).json({
                page:pageCurrent,
                limit:limitCurrent,
                listCart_approved:userCommentCart
            })
          }
            // get order is approving  (dang phep duyet)
            else if(success=="false"&&status_order=="true"){
          
                const list_cart_approving=await Cart.find({success:false,status_order:true}).skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
                console.log(list_cart_approving)
                const listCartUserComment=[];
                for(let i=0;i<list_cart_approving.length;i++){
                    const user=await User.findById(list_cart_approving[i]._id_user);
                    listCartUserComment.push({user:user,cart:list_cart_approving[i]})
                }
                res.status(200).json({
                    page:pageCurrent,
                    limit:limitCurrent,
                    listCart_approving:listCartUserComment
                })
            }
            
        //get order is cancel
            else if(success=="false" &&status_order=="false"){
                console.log(success+" "+status_order)
                const list_cart_cancel=await Cart.find({success:false,status_order:false}).skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
                const listCartUserComment=[];
                for(let i=0;i<list_cart_cancel.length;i++){
                    const user=await User.findById(list_cart_cancel[i]._id_user);
                    listCartUserComment.push({user:user,cart:list_cart_cancel[i]})
                }
                res.status(200).json({
                    page:pageCurrent,
                    limit:limitCurrent,
                    listCart_cancel:listCartUserComment
                })
            }
            else{
                //get all order
                const listCart_All=await Cart.find().skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
                const listCartUserComment=[];
                for(let i=0;i<listCart_All.length;i++){
                    const user=await User.findById(listCart_All[i]._id_user);
                    listCartUserComment.push({user:user,cart:listCart_All[i]})
                }
                res.status(200).json({
                    page:pageCurrent,
                    limit:limitCurrent,
                    listCart_All:listCartUserComment
                })
            }
        }catch(err){
            console.log(err)
        }

      }

       //----------------------------user------------------

      async GET_USER (req, res) {
        try{
            const {_id}=req.data.id;
            const user_Client= await User.findById(_id);
            const list_all_user=[];
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}
                    const {page,limit,role}=req.query;
                    const pageCurrent=parseInt(page)||1;
                    const limitCurrent=parseInt(limit)||10;
                if(role===0){
                    const listUser=await User.find({role:0}).skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
                   for(let i=0;i<listUser.length;i++){
                       const CommentUser=await Comment.find({_id_user:listUser[i]._id});
                       const CartUSER=await Cart.find({_id_user:listUser[i]._id});
                        list_all_user.push({user:listUser[i],comment:CommentUser.length,cart:CartUSER.length})
                   }

                   res.status(200).json({
                    page:pageCurrent,
                    limit:limitCurrent,
                    listUser:list_all_user
                   })

                }
                else if(role===1){
                    const listUser=await User.find({role:1}).skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
                    for(let i=0;i<listUser.length;i++){
                        const CommentUser=await Comment.find({_id_user:listUser[i]._id});
                        const CartUSER=await Cart.find({_id_user:listUser[i]._id});
                         list_all_user.push({user:listUser[i],comment:CommentUser.length,cart:CartUSER.length})
                    }
                    res.status(200).json({
                        page:pageCurrent,
                        limit:limitCurrent,
                        listUser:list_all_user
                    })
                }
                else{
                   const listUser=await User.find().skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
                     for(let i=0;i<listUser.length;i++){
                        const CommentUser=await Comment.find({_id_user:listUser[i]._id});
                        const CartUSER=await Cart.find({_id_user:listUser[i]._id});
                         list_all_user.push({user:listUser[i],comment:CommentUser.length,cart:CartUSER.length})}
                         res.status(200).json({
                            page:pageCurrent,
                            limit:limitCurrent,
                            listUser:list_all_user
                        })
                }


            
        }catch(err){
            console.log(err)
        }

      }

      async LIST_CART_USERS (req, res) {
        try{
            const {_id}=req.data.id;
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}
            const {page,limit,_id_user}=req.query;
            const pageCurrent=parseInt(page)||1;
            const limitCurrent=parseInt(limit)||10;
            const listCartUser=await Cart.find({_id_user:_id_user}).skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
            res.status(200).json({
                page:pageCurrent,
                limit:limitCurrent,
                listCartUser:listCartUser
            })

        }catch(err){
            console.log(err)
        }

      }
      async LIST_COMMENTS_USERS (req, res) {
        try{
            const {_id}=req.data.id;
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}
            const {page,limit,_id_user}=req.query;
            const pageCurrent=parseInt(page)||1;
            const limitCurrent=parseInt(limit)||10;
            const listCommentUser=await Comment.find({_id_user:_id_user}).skip(pageCurrent*limitCurrent).limit(limitCurrent).sort('timeComment');
            res.status(200).json({
                page:pageCurrent,
                limit:limitCurrent,
                listCommentUser:listCommentUser
            })
            
        }catch(err){
            console.log(err)
        }

      }
      async DELETE_COMMENT_USERS (req, res) {
        try{
            const {_id}=req.data.id;
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}
            const {id_comment,_id_product}=req.body;
            const comment=await Comment.findById(id_comment);
            if(!comment){
                return res.status(400).json({
                    message:"Comment không tồn tại"
                })
            }
           const ResultComment= await Comment.findByIdAndDelete(id_comment);
           const star=ResultComment.star || 0;
           const product=await Product.findById(_id_product);
           await Product.findByIdAndUpdate(_id_product,{rating:product.star-star,numReviews:product.numReviews>0?product.numReviews-1:0},{new:true});

            res.status(200).json({
                message:"Xóa comment thành công",
                ResultComment:ResultComment,
            })
        }catch(err){
            console.log(err)
        }

      }
      async DELETE_ACCOUNT_USER (req, res) {
        try{
            const {_id}=req.data.id;
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}
            const {_id_user}=req.body;
            const user=await User.findById(_id_user);
            if(!user){
                return res.status(400).json({
                    message:"User không tồn tại"
                })
            }
            const ResultUser= await User.findByIdAndDelete(_id_user);
            const ResultComment=await Comment.deleteMany({_id_user:_id_user});
            const ResultCart=await Cart.deleteMany({_id_user:_id_user});
            const comment=await Comment.find({});
            for(let i=0;i<comment.length;i++){
                const replyComment=Array.from(comment[i].replyComment);
                if(replyComment.length>0){
                    for(let j=0;j<replyComment.length;j++){
                        if(replyComment[j]._id_user==_id_user){
                            replyComment.splice(j,1);
                            await Comment.findByIdAndUpdate(comment[i]._id,{replyComment:replyComment},{new:true});
                        }
                    }
                }
            }
            res.status(200).json({
                message:"Xóa user thành công",
                ResultUser:ResultUser,
                ResultComment:ResultComment,
                ResultCart:ResultCart
            })
            
        }catch(err){
            console.log(err)
        }

      }

      async ACTIVE_ROLE (req, res) {
        try{
         const {_id}=req.data.id;
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}
            const {_id_user,role_update}=req.body;
            const user=await User.findByIdAndUpdate(_id_user,{role:role_update},{new:true});
            const CommentUpdateAllComment_role=await Comment.updateMany({_id_user:_id_user},{role:role_update},{new:true});
            const dataComment=await Comment.find({});
            for(let i=0;i<dataComment.length;i++){
                const replyComment=Array.from(dataComment[i].replyComment);
                for(let j=0;j<replyComment.length;j++){
                    if(replyComment[j]._id_user==_id_user){
                        replyComment[j].role=role_update;
                    }
                }
                await Comment.findByIdAndUpdate(dataComment[i]._id,{replyComment:replyComment},{new:true});
                }

            res.status(200).json({
                message:"Cập nhật thành công",
                user:user,
                CommentUpdateAllComment_role:CommentUpdateAllComment_role
            })

            
        }catch(err){
            console.log(err)
        }

      }

      async DELETE_ALL_CART (req, res) {
        try{
            const {_id}=req.data.id;
            const user_Client= await User.findById(_id);
            if(user_Client.role!=1){
                return res.status(400).json({
                        message:"Chức năng này được sử dụng cho admin "
                    })}
            const {_id_user}=req.body;
            const ResultDeleteAllCart=await Cart.deleteMany({_id_user:_id_user});
            res.status(200).json({
                message:"Xóa thành công",
                ResultDeleteAllCart:ResultDeleteAllCart
            })
        }catch(err){
            console.log(err)
        }

      }
      async Get_KeyProduct(rq,rs){
        const {key}=rq.query;
        const productKey=[];
        const data=await Product.find({key:key});
        data.forEach(element => {
            productKey.push(element.NSX);
        });
      
        rs.status(200).json({
           keyProductNsx:[...new Set(productKey)]
        })
      }

    //  LIST CARRT ALLL USER 
        async LIST_CART_ALL_USER (req, res) {
            try{
                const {_id}=req.data.id;
              
                const user_Client= await User.findById(_id);
                if(user_Client.role!=1){
                    console.log("k dc")
                    return res.status(400).json({
                       
                            message:"Chức năng này được sử dụng cho admin "
                        })}
                const list_All_Cart_Users=await Cart.find({}).sort({timeCart:-1});
                const dataCart=[];
                if(list_All_Cart_Users){
                    
                    for(let i=0;i<list_All_Cart_Users.length;i++){
                        const userCart=await User.findById(list_All_Cart_Users[i].id_User);
                        console.log(userCart)
                        dataCart.push({
                            _id:list_All_Cart_Users[i]._id,
                            _id_user:userCart._id,
                            poster_user:userCart.avatar,
                            name:list_All_Cart_Users[i].name,
                            address:list_All_Cart_Users[i].address,
                            phone:list_All_Cart_Users[i].phone,
                            totalSum:list_All_Cart_Users[i].totalSum,
                            timeCart:list_All_Cart_Users[i].timeCart,
                            cart:list_All_Cart_Users[i].cart,
                            payment:list_All_Cart_Users[i].payment,
                            success:list_All_Cart_Users[i].success,
                            status_order:list_All_Cart_Users[i].status_order,
                        })

                    }

                }
                res.status(200).json({
                    list_All_Cart_User:dataCart
                })
        }
        catch(err){
            res.status(400).json({
                message:"Lỗi"
            })
        }
}
    //  LIST CARRT -id
        async LIST_CART_ID (req, res) {
            try{
                const {_id}=req.data.id;
                const {id}=req.body
                const user_Client= await User.findById(_id);
                if(user_Client.role!=1){
                    return res.status(400).json({
                            message:"Chức năng này được sử dụng cho admin "
                        })}
                        
                const list_All_Cart_Users=await Cart.find({_id:id});
                const dataCart=[];
                if(list_All_Cart_Users){
                        const userCart=await User.find({_id:list_All_Cart_Users[0].id_User});
                        dataCart.push({userCart:userCart,list_All_Cart_Users:list_All_Cart_Users})
                }

                res.status(200).json({
                    list_All_Cart_User:dataCart,
                    userCart:dataCart[0].userCart,
                    list_All_Cart_Users_One:dataCart[0].list_All_Cart_Users
                })
        }
        catch(err){
            console.log(err)
            res.status(400).json({
                message:"Lỗi"
            })
        }

     }
}

module.exports=new controlAdmin