fs = require("fs");
var db = require('../db');
//var User = require('./User.js');
var institutionCollection = db.collection('institution');

function findById(id,cb){
    institutionCollection.findOne({_id : id},function(error,institution){
           if(error) {
               console.log('Error finding institution by id');
               cb(error,null);
           }
           else{
                // Person info found successfully
                cb(null,institution);
           }
        });
}

var Institution = {

    initialize : function(cb){
        institutionCollection.insert({name : '', logo : '', logoImageType : '', logoImageName : '', workers : [], ownsers : []}, {w:1}, function(error,results){
            cb(error,results[0]);   
        })
    },

    getProfile : function(username,cb){
       var User = require('./User.js');
       console.dir(User);
       User.getGenUserProfile(username,function(error,profile){
           if(error){
                //error retrieving general user profile
                console.log('error retrieving general institution profile');   
                cb(error,null);
           } 
           else{
               // General profile retrieved successfully
                    // retrieve person profile info
                findById(profile.profileInfo,function(error,institutionInfo){
                    if(error){
                        // error finding personal info
                        console.log('error finding institution info');
                        cb(error,null);
                    }
                    else{
                        // personal info retrieved successfully
                        delete profile.profileInfo;
                        profile.institution = institutionInfo;
                        // everything is fine thus far
                        cb(null,profile);
                    }
                });
           }
       });
    },

    updateProfile : function(option,query,cb){
        institutionCollection.update(option,query,function(error){
           cb(error); 
        });
    },

    findAll : function(cb){
        userCollection.find({}).toArray(function(error,userList){
            cb(error,userList);
        });
    },

    uploadProfilePic : function(user,imageMetaData, cb){
        
        if(imageMetaData){
            // Determing if image is valid
            var image = fs.readFileSync(imageMetaData.path);
            userCollection.update({username:user.username},{$set: {profilePic : image,profilePicImageType : imageMetaData.type, profilePicImageName : imageMetaData.name}},function(error){
                cb(error,image); 
             });
        }
        else{
            console.log('Some details missing');
            // Some details are missing. Return the error
            cb(new Error('Some details Missing'), null);
        }
    },

    publicise : function(user,cb){
        try{
            delete user.password;
            delete user.passwordResetCode;
            cb(null,user);
        }
        catch(exception){
            cb(exception,user);
        }
        
    }
}

module.exports = Institution;