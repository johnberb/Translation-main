require('dotenv').config();
const express = require("express");
const app= express();
const PORT=process.env.PORT || 3000
const indexRouter=require('./routes/index');
const expressLayouts= require('express-ejs-layouts');
const mongoose=require('mongoose');
const db = process.env.MONGODB_KEY; 
const userz= require('./routes/userss');
const session=require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const filex = require("./fileShare/filex");


//passport config
require('./config/passport')(passport);
 
function getUserFromSessionOrToken(req) {
    return req.user; // Assuming Passport.js attaches the user to req.user
} 

app.use(expressLayouts);
app.set('view engine','ejs');


// Add this at the top of your app, before mongoose.connect
//console.log('=== DEBUG MONGODB CONNECTION ===');
//console.log('MongoURI length:', process.env.MongoURI ? process.env.MongoURI.length : 'undefined');
//console.log('MongoURI starts with:', process.env.MongoURI ? process.env.MongoURI.substring(0, 20) + '...' : 'undefined');
//console.log('MongoURI contains @:', process.env.MongoURI ? process.env.MongoURI.includes('@') : 'undefined');
//console.log('MongoURI contains mongodb:', process.env.MongoURI ? process.env.MongoURI.includes('mongodb') : 'undefined');
// console.log('Full MongoURI:', process.env.MongoURI); // Be careful with this in production

// Then your existing mongoose connection
mongoose.set('strictQuery',true)
mongoose.connect(db,{useNewUrlParser:true,useUnifiedTopology: true})
.then(()=>console.log('Database connected'))
.catch(err=>console.log(err))

app.use(session({
    secret:'secret',
    resave:true,
    saveUninitialized:true
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    // Assuming you have a function to get the user from the session or token
    req.user = getUserFromSessionOrToken(req);
    next();
});


//to color the msg use global variables

app.use((req,res,next)=>{
    res.locals.success_msg=req.flash('success_msg');
    res.locals.error_msg=req.flash('error_msg');
    res.locals.error=req.flash('error');
    res.locals.user = req.user;
    next();
})

app.use(express.urlencoded({extended:false}));
app.use(indexRouter);
app.use('/users',userz);


filex(app);

app.listen(PORT,console.log(`sever started on ${PORT}`));
// Serve static files
app.use(express.static('public'));

