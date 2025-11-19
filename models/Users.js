
const mongoose = require("mongoose");
const userSchema= new mongoose.Schema(
    {
        name:{type:String, required: true},
        email:{type:String, required: false},
        password:{type:String,required:false},
        googleId:{type:String, required: false},
        facebookId:{type:String, required: false},
        twitterId:{type:String, required: false},
        date:{type:Date, default:Date.now}
    }
)
const User=mongoose.model('User',userSchema);
module.exports=User;
