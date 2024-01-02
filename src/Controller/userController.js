const User=require('../Modal/User');

const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const createErorr=require('http-errors')
const sendMail=require('../Controller/sendMail');
const {signAccessToken,signRefreshToken,verifyRefreshToken}=require("../helpers/jwt_helpers")
const { default: mongoose } = require('mongoose');
const {google}=require("googleapis");
const cloudinary=require('cloudinary');
const comment=require('../Modal/Comment');
const axios = require('axios').default;
const {OAuth2}=google.auth; 
const {
    MAILING_SERVICE_CLIENT_ID,
    GOOGLE_SECRET,
    MAILING_SERVICE_REFRESH_TOKEN,
    REDIRECT_URI,
    CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    google_Login_clientId
} =process.env
const client=new OAuth2(MAILING_SERVICE_CLIENT_ID)

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret:  CLOUDINARY_API_SECRET
})

class userConTroller{
    async  userRegisTer(rq,rs){
        try{
        const {email,name,password}=rq.body;
        const checkEmail=await User.findOne({email:email});
    if(checkEmail){
       
        rs.status(400).json({
            message:'error email khong duoc truong nhau'
        })
    }
      
     
       const checkEmailExist=await User.findOne({email:email})
    
       if(checkEmailExist){
        return  rs.status(400).json({message:"Tài email  này  tồn tại"})
       }
       if(!password){
           return   rs.status(400).json({message:"Vui lòng nhập password "})
       }
     
       const passwordHash= await bcrypt.hash(password,12)
       const newUser={name,email,password:passwordHash};

       const accessToken=createActiveToken(newUser);
         const url=`${process.env.url_user_client}/active-email/${accessToken}`;
        sendMail(email,url,"Click xác nhận địa chỉ email của bạn")
      
      rs.status(200).json({
          message:"xác minh địa chi mail của bạn"
      })
    }
    catch(error){
        rs.status(400).json({
            message:error
        })
    }
}

async userActiveEmail(rq,rs){
    
    try{
        // Unexpected token " in JSON at position 0 la ben client khong gui len mot object nhu {accessToken:accessToken}
        const {accessToken}=rq.body;
        console.log(accessToken)
        //chuyen tu token sang object chua nam,email,password
         const user=jwt.verify(accessToken,process.env.ACTIVATION_TOKEN_SECRET);
         
         const { email, password, name}=user
        const checkMail=await User.findOne({email:email});
        if(checkMail){
        return rs.status(400).json({
                message:"tài khoản này tồn tại"
            })
        }
        const newUser=new User({
            _id:new mongoose.Types.ObjectId(),
            name:name.trim(),
            email:email,
            password:password,
            role:0
        })
         /*var escape = app.get('json escape')
          TypeError: Cannot read properties of undefined (reading 'get')            
          trong hamf de (rs)
          ma ben duoi de res
          */

      const result=await newUser.save();
      const token= await signAccessToken(result);
  
   
        rs.status(200).json({
            user:result,
            token
        })


    }
    catch(error){
        rs.status(400).json({
            message: "loi"
          });
    }

}
    async userChangPassword(rq,rs){
        try{
            const {id}=rq.data;
            const {password}=rq.body;
        
            if(!password){
                return rs.status(400).json({
                    message:"password không được để rỗng"
                })
            }
            const result=await User.findOne({_id:id._id})
          
            if(result){
                const passwordhash=await bcrypt.hash(password,12);
                const passwordUpdate={
                    password:passwordhash
                }
                const user=await User.findByIdAndUpdate(id._id,passwordUpdate,{new:true})
                rs.status(200).json({
                    message:"update thanh cong password"
                })
            }
        }

        catch(err){
            rs.status(400).json({
                message:err
            })
        }
       
       
    }
    async  userLogin(rq,rs){
        try{
            const {email,password}=rq.body
         
            const user=await User.findOne({email:email});
            if(!user){
                return rs.status(400).json({
                    message:"email bạn vừa nhập chưa đăng ký ,vui lòng đăng ký trước khi login"
                })
            }
            const checkPassword=await bcrypt.compare(password,user.password);
            if(!checkPassword){
                return rs.status(400).json({
                    message:"Password sai! vui lòng nhập lại "
                })
            }
            const accessToken=await signAccessToken(user);
            const refreshToken=await signRefreshToken(user);
            const userResult=await User.findById(user._id);
            rs.send({
                accessToken:accessToken,
                refreshToken:refreshToken,
                user:userResult
            })
        }
        catch(err){
            rs.status(400).json({message:"error"})
        }
    }
    async userGetProfile(rq,rs){
        try{
            const id=rq.data.id
            //id nau laf toan bo thong tin cua user 
            const userGetProfile=await User.findById(id._id);
          rs.status(200).json({
              user:userGetProfile
          })
        }
        catch(err){
            rs.status(400).json({
                message:err
            })
        }
    }
    //khi mà accessToken hết thời gian thì phía client se gửi lên một acesstoken
    async userResFesToken(rq,rs){
        try{
            const {refreshToken}=rq.body;
     
            if(!refreshToken){
               throw createErorr.BadRequest()
            }
            
            const id= await verifyRefreshToken(refreshToken)
            //id nay toan bo thong tin nguoi dung
            const accessToken=await signAccessToken(id);
            const refToken=await signRefreshToken(id)
            //ham verify di verify mot chuoi token thanh thong tin nguoid ung
            rs.send({ accessToken: accessToken, refreshToken: refToken })
        }
        catch(err){
            rs.status(400).json({
                message: err
              });
        }
    }
    async  userUploadImage(req,res){
        try {
            const { id } = req.data;          
            if(!req.file){
             return   res.status(400).json({
                    message:"no file update"
                })
            }
           const useravatar={
               avatar:req.file.path
           }
        
            const userUpader=await User.findByIdAndUpdate(id._id,useravatar,{new:true})
            const commentUpdate=await comment.updateMany({_id_user:id._id},useravatar,{new:true});
            const dataReply=await comment.find();
            for(var i=0;i<dataReply.length;i++){
                   const reply=Array.from(dataReply[i].reply);
                   if(reply>0){
                    for(var j=0;j<reply.length;j++){
                        if(reply[j]._id_user==id._id_user){
                            reply[j].avatar=req.file.path;
                            await comment.findByIdAndUpdate(dataReply[i]._id,{reply:reply},{new:true})
                        }
                    }
                   }
         }
            res.status(200).json({
                user:userUpader,
                dataComment:commentUpdate
            })
        } 
        catch (error) {
            res.json({
                message:error
            })
            
        }
      
    }

  async userUpdateInformation(rq,rs){
      try{
        const {name}=rq.body;
        const {id}=rq.data;
        const userUpdatename={
            name:name
        }
        const userName=await User.findByIdAndUpdate(id._id,userUpdatename,{new:true})
        rs.status(200).json({
            user:userName
        })
      }
      catch(err){
          rs.status(400).json({
              message:err
          })
      }
    }
    
    async userForgetPassword(rq,rs){
        try{
            const {email}=rq.body
            const user=await User.findOne({email:email})
            if(!user){
             return   rs.status(400).json({
                    message:"email này không tồn tại"
                })
            }
    
            const accessToken=createActiveToken({email:email});
            const url=`${process.env.url_user_client}/resetPassword/${accessToken}`;
            sendMail(email,url,"Click để cập nhật lại email")
            rs.status(200).json({
                message:"Vui lòng kiểm trả mail để đặt lại mật khẩu"
            })

        }
        catch(err){
            rs.status(400).json({
                message:err
            })
        }
        //tao token email 
    }
   async userResetPassword(rq,rs){
        try{
            
            const {password,accessToken}=rq.body
            const email=jwt.verify(accessToken,process.env.ACTIVATION_TOKEN_SECRET);
            const user=await User.findOne({email:email.email});
            if(!user){
                return rs.json({
                    message:"email này không tồn tại vui lòng nhập lại"
                })
            }
          const passwordHash=await bcrypt.hash(password,12);
          await User.findOneAndUpdate({email:email.email},{password:passwordHash},{new:true});
          //phair tao lai token moi gui lai cho user
          //vi khi update lai thi token ban dau khac vs toke thu 2
          const tokennew=await signAccessToken(user);
          rs.status(200).json({
              user:user,
              token:tokennew
          })
        }
        catch(err){
            rs.status(400).json({
                message:err
            })
        }
    }

    async userLoginGoogle(rq,rs){
        try{
        const {tokenId}=rq.body;
        //thang nay laf verify token google toke id phai trung vs id_client google ben app
        const verify=await client.verifyIdToken({idToken:tokenId,audience:google_Login_clientId});
        const { email_verified,email,name,picture}=verify.payload
        if(!email_verified){
            return rs.status(400).json({
                message:'Email verification failed'
            })
        }
        const user=await User.findOne({email});
        if(user){
            const access_token=await signAccessToken(user);
            rs.status(200).json({
                user:user,
                token:access_token
            })
        }
        else{
            const passwordLoinGoogle=email+GOOGLE_SECRET;
            const passwordHash=await bcrypt.hash(passwordLoinGoogle,12)
            const newUserLogin=new User({
                _id:new mongoose.Types.ObjectId(),
                name:name,
                email,
                password:passwordHash,
                avatar:picture,
                role:0
            })
            await newUserLogin.save();
            const userLogin=await User.findOne({email});
            const accessToken=await signAccessToken(userLogin);
            rs.status(200).json({
                 user:userLogin,
                 token:accessToken
            })
        }
       }
       catch(err){
           rs.status(400).json({
               message:err
           })  
       } 
    }

    async userLoginFacebook(rq,rs){
        try{
        const {userId,accessToken}=rq.body
        const urlGraphFacebook=`https://graph.facebook.com/v2.11/${userId}/?fields=id,name,email,picture&access_token=${accessToken}`
        const responseFaceBook=await axios.get(urlGraphFacebook);
        const {email,name,picture}=responseFaceBook.data
        const {url}=picture.data
        if(!responseFaceBook){
            return  rs.status(400).json({
                message:'verify email fail'
            })
        }
            const resultUser=await User.findOne({email:email});
            if(resultUser){
               const accessToken=await signAccessToken(resultUser);
                rs.status(200).json({
                token:accessToken,
                user:resultUser
               })
            }
            else{
                const password=email+process.env.Client_id_facebooke;
                const passportHash=await bcrypt.hash(password,12)
                const newUser=new User({
                    _id:new mongoose.Types.ObjectId(),
                    name:name,
                    email,
                    password:passportHash,
                    avatar:url
                })

                await newUser.save();
                const AcessToken=signAccessToken(newUserSave);
                const userLoginFacebooks= await User.findOne({email:email})
                rs.status(200).json({
                    token:AcessToken,
                    user:userLoginFacebooks
                })
            }
    }
    catch(err){
        rs.status(400).json({
            message:'error'
        })
    }
    }

    async userEditName(rq,rs){
        try{

       
        const {name}=rq.body;
        const {_id}=rq.data.id;
        const user=await User.findById(_id);
        if(!user){
              return rs.status(400).json({
                message:"user not exist"
              })
        }

        await User.findByIdAndUpdate(_id,{name:name})
        rs.status(200).json({
            message:'update success'
        })
    }
    catch(err){
        rs.status(400).json({
            message:err
        })
    }

    }
}

const createActiveToken=(payload)=>{
   return jwt.sign(payload,process.env.ACTIVATION_TOKEN_SECRET,{expiresIn:'15m'})
}
module.exports=new userConTroller


/*User


*/