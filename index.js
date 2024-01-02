const express=require('express');
const app=express();
const Router=require('./src/Router/Index');
require("dotenv").config();
const PORT=process.env.PORT||8000;
const Connectdb=require('./connectdb');
const bodyparser=require('body-parser');
const cors=require('cors');
const path=require('path');
const moment=require('moment');
const timeComment=moment().format();
const jwt=require('jsonwebtoken')


/*==========================================================*/
//thiet lap giao dien

const handlebars=require('express-handlebars');
 var hbs  = handlebars.create({
 });

app.engine('handlebars', hbs.engine);
 app.set('view engine', 'handlebars');
 app.set('views',path.join(__dirname,'views'))

/*==========================================================*/
app.use(cors());
/*=====body parser =========*/

app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json())
app.use(express.json())

/*==========================================================*/
//----thiết lập cors cho server ---

app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

/*==========================================================*/
//-------sockie.io------------------
const server =require('http').createServer(app);
/* thiet lâp cors cho socket io */
const io=require('socket.io')(server,{
  cors: {
    //cho phep port 3000 truy cap vao server
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Header",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      "Access-Control-Allow-Methods",
    ],
    credentials: true,
  },
})


const view=require('./src/Modal/View');
const comment=require('./src/Modal/Comment');
const product=require('./src/Modal/Products');
const user=require('./src/Modal/User');


const { default: mongoose } = require('mongoose');




let countUserOnline=[];
let userComment=[];
  io.on("connection",(socket)=>{
    console.log("co nguoi ket noi den ",socket.id);
    //join room
    socket.on('joinRoom',(id)=>{
      console.log("dau la id join room o trang chi tiet san pham sau khi join lai so sanh ca user khac nhau ",socket.id)
      console.log(id)
      
      // Jd-5kjCsVmhj5mHaAAAB
      
   //mỗi mà hình khách hàng trang chi tiết sản phẩm sẽ có một sokect.id khác nhau còn ở màng hình 1 người sử dụng sẽ có 1 socket.id
  //  đầu tiên minh kiểm tra trong mảng chô socket.id có socket.id này chưa nếu có thì không thêm vào nữa nếu chưa thì thêm vào
  // trường hợp băng nhau la 1 nguoi sử dụng một màn hình sẽ có 1 socket thì trường hợp đầu đã thêm vào mảng có id là socket đó rồi 
  // thì trường hợp 2 không cần thêm vào nữa chỉ cần cập nhật lại user tại vị trí đó bằng id và join lại thôi 
  //cai trường hợp == nhau là người dùng vào sản phẩm khác nhưng socket.id giống nhau còn id của trang sản phẩm đó khác nhau 
      const user={
        userId:socket.id,
        room:id
      }
      console.log(socket.id)
      const check=userComment.every(user=>user.userId!=socket.id);
    
      if(check){
        userComment.push(user);
       
        socket.join(user.room)
      }
      else{
        userComment.map(user=>{
          if(user.userId==socket.id){
            if(user.room!==id){
              socket.leave(user.room);
              socket.join(id)
              user.room=id
            }
          }
        })
      }
    })

    //count user online
    socket.on("countUserOnline",async (id)=>{
     
      try{
        const user={
          userId:socket.id,
          room:id
        }
          const check=countUserOnline.every((user)=>user.userId!=socket.id);
          const resultView=await view.findById(process.env.ID_VIEW);
          
          const resultUpdate = await view.findByIdAndUpdate(resultView._id, { View: resultView.View + 1 }, { new: true });
         if(check){
           countUserOnline.push(user);
           socket.join(user.room)
           }
           const data={
             accountOnline:countUserOnline.length,
             view:resultUpdate
           }
           io.sockets.emit("severCountUserOnline",data)
      }
      catch(e){
        console.log(e)
      }
    })

    //tao comment

    socket.on('createComment',async (dataComment)=>{
    try{
      console.log('day la noi dung comment'+dataComment)
    
      const {idComment,_id_product,contentComment,send,star,token,nameUserReply}=dataComment;
      console.log('day la token'+token)
      
      const user=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
      console.log('day la user'+user)
      if(user){
        const productResult=await product.findById(_id_product);
        const productArray={
          name:productResult.name,
          // poster:productResult.poster[0].url,
          key:productResult.key,
          NSX:productResult.NSX
        }
        if(send!=="replyComment"){
          const newComment=await comment({
            _id:new mongoose.Types.ObjectId(),
            _id_product,
            _id_user:user.id._id,
            timeComment,
            contentComment:contentComment,
            name:user.id.name,
            avatar:user.id.avatar,
            role:user.id.role,
            star,
            editComment:false,
            productArray
          })
          const updateProduct={
            numReviews:productResult.numReviews+1,
            rating:star>0?productResult.rating+star:productResult.rating
          }
         const products=  await product.findByIdAndUpdate(_id_product,updateProduct,{new:true});
         const newComments=  await newComment.save();
         const dataCommentonProduct=await comment.find({_id_product});
         const oneStar=await comment.find({_id_product,star:1})
         const twoStar=await comment.find({_id_product,star:2})
         const threeStar=await comment.find({_id_product,star:3})
         const fourStar=await comment.find({_id_product,star:4})
         const fiveStar=await comment.find({_id_product,star:5})
         const starRating={
          oneStar:oneStar.length,
          twoStar:twoStar.length,
          threeStar:threeStar.length,
          fourStar:fourStar.length,
          fiveStar:fiveStar.length
         }
         
         const SumstarRating=oneStar.length+twoStar.length+threeStar.length+fourStar.length+fiveStar.length;
         const resultSendCommnetUser={
          numberComment:dataCommentonProduct.length,
          dataComment:dataCommentonProduct,
          starRating,
          SumstarRating,
          newComments,
          products,
          numReviews:products.numReviews,
          reviewRating:star>0&&products.rating>0?((products.rating)/SumstarRating):0
         }
         io.to(newComment._id_product).emit('serverSendNewComment',resultSendCommnetUser)
        }
        else{
          const newReplyCommnet=new comment({
            _id:new mongoose.Types.ObjectId(),
            _id_product,
            _id_user:user.id._id,
            timeComment,
            contentComment,
            name:user.id.name,
            avatar:user.id.avatar,
            role:user.id.role,
            star:0,
            editComment:false,
            productArray,
            nameUserReply:nameUserReply
          })
          const Comment=await comment.findById(idComment);
          Comment.reply.push(newReplyCommnet);
          await Comment.save();
        
          io.to(Comment._id_product).emit('serverSendReplyComment',Comment);
        }
      }
    
    }
    catch(err){
      console.log(err)
    }
     } 
    )

    //updata comment
    socket.on('userUpdateComment',async (dataComment)=>{
      try{
        const {idComment,_id_product,contentComment,star,token}=dataComment;
        
        const user=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const createdAt = new Date().toISOString()
        const comments=await comment.findById(idComment);
        const dataReplyComment=await comment.find({_id_product});
        if(user){
          if(comments){
            const updataComment={
             star,
             contentComment,
             createdAt,   
            }
            const updateComment =await comment.findByIdAndUpdate(idComment,updataComment,{new:true});
            const resultSendNewCommentUser={
              updateComment,
             }
             io.to(updateComment._id_product).emit('serverSendNewUpdateComment',resultSendNewCommentUser);
       } 
       if(dataReplyComment){
        for(var i=0;i<dataReplyComment.length;i++){
          const reply=Array.from(dataReplyComment[i].reply);
          if(reply.length>0){
            for(var j=0;j<reply.length;j++){
              if(reply[j]._id==idComment){
                reply[j].contentComment=contentComment;
                reply[j].editComment=true;
                const resultUpdateReply=await comment.findByIdAndUpdate(dataReplyComment[i]._id,{reply:reply},{new:true});
                io.to(resultUpdateReply._id_product).emit('serverSendReplyUpdateComment',resultUpdateReply);
                break;
              }
            }
          }
        }
       }
      } 
    }
    catch(err){
        console.log(err)
      }
    })

    //xoa mot comment

    socket.on('userDeleteComment',async (dataComment)=>{
      try{
        const {idComment,_id_product,token}=dataComment;
        const user=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        if(user){
           const comments=await comment.findById(idComment);
           const products=await product.findById(_id_product);
           const dataReplyComment=await comment.find({_id_product});
           if(comments){
           const resultCommentDelete=await comment.findByIdAndDelete(idComment);
            const dataUpdateProduct={
              rating:resultCommentDelete.star>0? products.rating - resultCommentDelete.star:products.rating,
              numReviews:products.numReviews-1
            }
           const productUpdateId=await product.findByIdAndUpdate(_id_product,dataUpdateProduct,{new:true}); 
            const oneStart=await comment.find({_id_product,star:1})
            const twoStart=await  comment.find({_id_product,star:2})
            const threeStart=await comment.find({_id_product,star:3})
            const fourStart=await comment.find({_id_product,star:4})
            const fiveStart=await comment.find({_id_product,star:5});
            const starRating={
              oneStar:oneStart.length,
              twoStar:twoStart.length,
              threeStar:threeStart.length,
              fourStar:fourStart.length,
              fiveStar:fiveStart.length
            }
            const sumRating=oneStart.length+twoStart.length+threeStart.length+fourStart.length+fiveStart.length;
             const serverSendatadeleteComment={
              dataCommentDelete:resultCommentDelete,
              starRating,
              sumRating,
              numReviews:productUpdateId.numReviews,
              reviewRating:productUpdateId.rating>0?productUpdateId.rating/sumRating:0
             }
             io.to(resultCommentDelete._id_product).emit('serverSendDeleteComment',serverSendatadeleteComment)
           }  

           if(dataReplyComment){
            for(var i=0;i<dataReplyComment.length;i++){
              const reply=Array.from(dataReplyComment[i].reply);
              if(reply.length>0){
                for(var j=0;j< reply.length;j++){
                  if(reply[j]._id==idComment){
                    reply.splice(j,1)
                    const dataCommentDelete=await comment.findByIdAndUpdate(dataReplyComment[i]._id,{reply:reply},{new:true});
                   
                    io.to(dataCommentDelete._id_product).emit("serversenduserDeleteComment",dataCommentDelete)
                    break;
  
                  }
                }
              }
            }
  
          }
        }
      }
      catch(err){
        console.log(err)
      }
    })
     
    //update information

    socket.on('userUpdateInformation',async(dataInformation)=>{
      try{
        const {name,token}=dataInformation;
   
       
        const tokenUser=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
       
         const dataUser=await user.findById(tokenUser.id._id);
      
         if(dataUser){
           const dataUpdate={
            name:name
           }
           //update user truoc sau do update comment
           const dataUserUpdateName=await user.findByIdAndUpdate(tokenUser.id._id,dataUpdate,{new:true})
           //update ngay  lập tức 
          await comment.updateMany({_id_user:tokenUser.id._id},dataUpdate,{new:true});
           // phai tiem tat ca comment sau do moi update vi trong comment cos reply comment nua
          const dataReply=await comment.find();
          for(var i=0;i<dataReply.length;i++){
            const reply=Array.from(dataReply[i].reply);
            if(reply.length>0){
              for(var j=0;j<reply.length;j++){
                if(reply[j]._id_user==tokenUser.id._id){
                  reply[j].name=name;
                  //update nguyen cai mang
                  await comment.findByIdAndUpdate(dataReply[i]._id,{reply:reply},{new:true})
                }
              }  
            }
            const userupdate={
              user:dataUserUpdateName,
              id_user:tokenUser.id._id
            }
            io.sockets.emit("serverSendNameUpdate",userupdate)
          }
         }
      }
      catch(err){
        console.log(err)
      }
    })
    //viet comment 
    socket.emit("userWriteComment",(mgs)=>{
      const { idProduct, message } = msg;
      io.to(idProduct).emit("sersendMessageComment",message);
    })

    //upload imgage 
    socket.emit("userUploadImage",(mgs)=>{
      const { idUser, avatar } = msg;
      io.to(idProduct).emit("sersendMessageComment",message);
      const resultData = {
        userId: idUser,
        user: avatar
      }
      io.sockets.emit("serverUserUploadAvatar", resultData);
    })
    //sockitio upload anh vs pickerOverPlay
    socket.on('updateProfilePicker',async (data)=>{
       const {token,avatar}=data;
       const userVerify=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
       if(userVerify){
        const  resultUserUpLoadfile= await user.findByIdAndUpdate(userVerify.id._id,{avatar:avatar},{new:true});
       const commentUpdate=await comment.updateMany({_id_user:userVerify.id._id},{avatar:avatar},{new:true})
       const commentDataAll=await comment.find();
       for(var i=0;i<commentDataAll.length;i++){
        const reply=Array.from(commentDataAll[i].reply);
        if(reply.length>0){
          for(var j=0;j<reply.length;j++){
            if(reply[j]._id_user==userVerify.id._id){
              reply[j].avatar=avatar;
              await comment.findByIdAndUpdate(commentDataAll[i]._id,{reply:reply},{new:true})
            }
          } 
        }
       }
       const dataUpload={
        userUpload:resultUserUpLoadfile,
        commentReply:commentDataAll,
        commentId:commentUpdate,
        userId:userVerify.id._id
       }

       io.sockets.emit("serverSendUpdatePicker",dataUpload)
      }
    })
    socket.on("disconnect", async () => {
      console.log(socket.id + " disconnected.");
      userComment = userComment.filter((user) => user.userId !== socket.id);
      countUserOnline = countUserOnline.filter((user) => user.userId !== socket.id);
      const resultView = await view.findById(process.env.ID_VIEW);
      io.sockets.emit("severCountUserOnline", { accountOnline: countUserOnline.length, view: resultView.View });
    });


  })
/*===========================ConnectDB===============================*/
Connectdb();
/*===========================ConnectDB===============================*/
/*truy cap den cac router*/
 Router(app);
//sockiio

 app.get("/",(rq,rs)=>{
   rs.render("Trangchu")
   }) 
  
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

//-----------------hoc socke.io-----------------------
/*ứng dụng realtime chuyển dữ liệu ngay lập tức thằng a vừa truyền dữ liệu thì thằng b nhận lại 
Ngay lập tức
const server1=require('http').Server(app);
const io=require('socket.io')(server1);
var manguse1=[];
io.on('connection',(socket)=>{
  console.log(socket.adapter.rooms)
  console.log("co nguoi truy cap")
  socket.on('user-tao-room',(value)=>{
  
   socket.join('Adroid')
  })
})

//gui ve cho tat ca thang o client
io.sockets.emit("server-send-data",data);
//gui ve cho mot thang nào gửi tín hiệu lên
socket.emit("",data);

//gửi về cho những thằng khác mà không gửi lại cho thàng gửi lên server
socket.broadcast.emit()

--Authentication (xac Thuc)
là hành động xác thực , kiểm tra người dùng có phải là một người dùng
hợp lệ trong hệ thống hay không ,này là bước đầu tiên trong một quy trình bảo mật nào
vidu người dùng đăng nhâp vào web và sử dụng username,password thì chúng ta sẽ tiến hành
authentication để xác thực người dùng xem thông tin này có chính xác hay không 

--authorization ủy uyền
cấp uyền cho người dùng truy cập vào tài nguyên hoặc chức năng củ thể
 và authorization sẽ được thưcj hiện sau bước authentication xác thực,
 authorization còn đảm bảo người đang gửi request đã đăng nhập vào hệ thống
 jwt là authorization 

 đầu tiên nếu thông tin người dùng nhập vào là đúng thì server sẽ tạo ra một section mới cho
 user đó lưu trữ section này ở phía server sau đó server sẽ gửi lại cho client một section id lưu trữ phía client
 ở những request tiếp theo user sẽ gửi lên môt section id cokki
--cách này hoạt động rất tốt nhưng đối vs những ứng dụn web hiện nay chúng ta k chỉ có 1 mà có rất nhiều server

--
 khi người dùng gửi yêu cầu  đến server chúng ta sẽ có một load balancer  để quyêt định xem server này xử lý yêu cầu nào

vidu khi user thực hiện đang nhạp và định hướng đến server 1 thì thông tin người dùng sẽ đc lưu trữ ở seerver1
khi ngưởi dùng thực hiện những định hướng tiếp theo và đc định hướng đến server 2
server 2 k biết thông tin gì về request trước đó bởi vì thông tin đc lưu trữ trong server 1
,bây giờ mình sẽ dùng jwt authorization để giải quyết vấn đề này  ở server mình sẽ gửi về thông tin một người dùng như một token
khi người dùng gửi những request tiếp theo thì jwt token đc gửi đi server sẽ xacs thực chữ ký này lúc này thông tin người dùng đc
lưu ở phía client chứ k đc lưu ở server  

jwt gồm 3 phần 

 header
 payload chứ thông tin người dùng
 signature 
*/

