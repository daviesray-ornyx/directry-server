
/**
 * Module dependencies.
 */

var express = require('express');

var authRoutes = require('./routes/authRoutes');
var institutionRoutes = require('./routes/institutionRoutes');
var personRoutes = require('./routes/personRoutes');

var http = require('http');
var path = require('path');

var passport = require('passport');
var passportHttp = require('passport-http');
var bodyParser = require('body-parser');
var multer = require('multer');
var bcrypt = require('bcrypt-nodejs');

var db = require('./db');
var User = require('./models/User');

var app = express();

//this is great




// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({extended:true})); // this is one place we've gotta optimize data transfer -- , uploadDir:'./uploads',limit: '10mb'
app.use(bodyParser.json());
app.use(multer({ 
    dest: './uploads/temp/',
    rename: function (fieldname, filename) {
        return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
    },
    onFileUploadStart: function (file) {
      console.log(file.fieldname + ' is starting ...')
    },
    onFileUploadData: function (file, data) {
      console.log(data.length + ' of ' + file.fieldname + ' arrived')
    },
    onFileUploadComplete: function (file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path)
    },
    onParseStart: function () {
      console.log('Form parsing started at: ', new Date())
    },
    onError: function (error, next) {
      console.log(error)
      next(error)
    },
    onFileSizeLimit: function (file) {
      console.log('Failed: ', file.originalname)
      fs.unlink('./' + file.path) // delete the partially written file
    },
    onFilesLimit: function () {
      console.log('Crossed file limit!')
    },
    onFieldsLimit: function () {
      console.log('Crossed fields limit!')
    },
    onPartsLimit: function () {
      console.log('Crossed parts limit!')
    }
}));
app.use(passport.initialize());

passport.use(new passportHttp.BasicStrategy(function(username, password, next){
    // verify user
    User.authenticate({username : username, password : password},function(error,user){
        if(error){ 
            console.log('Error Authenticating User');
            next(error,null);
        }
        else{
            console.log('User has been authenticated!!');
            next(null,user); 
        } 
    });
}));

passport.serializeUser(function(user,done){
    done(null,user.username);
});

passport.deserializeUser(function(username,done){
    var userCollection = db.collection('users');
        
        User.findByUsername({username : username},function(error,user){
            if(error){ 
                console.log('Error retrieving user');
                done(error,null);
            }
            else if(user){ 
                //console.dir(userList[0]);
                done(null,user);
            }
            else{
                console.log('No user found');
                done(null,null);
            }  
        });
})

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


//BEGIN Authentication Routes, these are for general users.... we however need to know the user type
app.get('/', authRoutes.index);
app.post('/api/auth/register', authRoutes.register); 
app.post('/api/auth/login', authRoutes.login); 
app.get('/api/auth/request_password_reset_code', authRoutes.requestPasswordResetCode);  
app.post('/api/auth/reset_password', authRoutes.resetPassword);                        
app.get('/api/auth/user/:username?',passport.authenticate('basic'), authRoutes.findUser); 
 // BEGIN contacts
app.get('/api/user/contact',authRoutes.getContact); //done
app.post('/api/user/contact/add',passport.authenticate('basic'),authRoutes.addContact); //done  
app.get('/api/user/contact/remove',passport.authenticate('basic'),authRoutes.removeContact);    //done
// END contacts
// BEGIN mappable
app.get('/api/user/mappable',authRoutes.getMappable); //done
app.post('/api/user/mappable/set_location',passport.authenticate('basic'),authRoutes.setLocation);  //done
app.post('/api/user/mappable/set_type',passport.authenticate('basic'),authRoutes.setMappableType);              // once this changes, the icon also changes automatically
app.get('/api/user/contact/remove',passport.authenticate('basic'),authRoutes.removeContact);    //done
// END mappable

//app.post('/api/auth/login', authRoutes.login);         // we've opted for the header option.... This is not yet fully comprehended
//app.get('/api/auth/logout',passport.authenticate('basic'), authRoutes.logout);
//app.get('/api/auth/delete_account',passport.authenticate('basic'), authRoutes.deleteAccount);   // not to be handled yet
//END  Authentication Routes

//BEGIN Person Routes , authentication already handled
app.get('/api/person/profile',personRoutes.getProfile);                 // done
app.post('/api/person/profile/full_name',passport.authenticate('basic'), personRoutes.updateFullName);    //done     
app.post('/api/person/profile/profile_pic' ,passport.authenticate('basic'), personRoutes.updateProfilePic);     //done 
//app.post('/api/person/add_workplace', passport.authenticate('basic'), personRoutes.addWorkPlace);
//app.get('/api/person/remove_workplace', passport.authenticate('basic'), personRoutes.removeWorkPlace);
//app.post('/api/person/add_owned', passport.authenticate('basic'), personRoutes.addOwned);
//app.get('/api/person/remove_owned', passport.authenticate('basic'), personRoutes.removeOwned);
app.get('/api/person/people', personRoutes.listPeople);       // done
//END  Person Routes

//BEGIN Person Routes , authentication already handled
app.get('/api/institution/profile',institutionRoutes.getProfile);   // done
app.post('/api/institution/profile/name',passport.authenticate('basic'), institutionRoutes.updateName); //done
app.post('/api/institution/profile/logo' , passport.authenticate('basic'), institutionRoutes.updateLogo);   //done
//app.post('/api/institution/profile/add_photo',passport.authenticate('basic'), institutionRoutes.addPhoto);
//app.get('/api/institution/profile/remove_photo',passport.authenticate('basic'), institutionRoutes.removePhoto);
//app.post('/api/institution/add_worker',passport.authenticate('basic'), institutionRoutes.addWorker);
//app.get('/api/institution/remove_worker',passport.authenticate('basic'), institutionRoutes.removeWorker);
//app.post('/api/institution/add_owner',passport.authenticate('basic'), institutionRoutes.addOwner);
//app.get('/api/institution/remove_owner',passport.authenticate('basic'), institutionRoutes.removeOwner);
app.get('/api/institution/institutions', institutionRoutes.listInstitutions);       //done
//END  Person Routes



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
