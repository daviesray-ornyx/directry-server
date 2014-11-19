var fs = require("fs");
var db = require('../db');
var User = require('./User.js');
//var Contact = require('./Contact.js');
//var Mappable = require('./Mappable.js');
var personCollection = db.collection('person');

function findById(id,cb){
    personCollection.findOne({_id : id},function(error,person){
           if(error) {
               console.log('Error finding person by id');
               cb(error,null);
           }
           else{
                // Person info found successfully
                cb(null,person);
           }
        });
}

var Person = {

    initialize : function(cb){
        personCollection.insert({fullName : '',profilePic : '',profilePicImageType : '',profilePicImageName : '', worksAt : [], owns : []}, {w : 1},function(error,results){
            cb(error,results[0]);   
        })
    }, 

    getProfile : function(username,cb){
       User = require('./User.js');
       console.dir(User);
       User.getGenUserProfile(username,function(error,profile){
           if(error){
                //error retrieving general user profile
                console.log('error retrieving general user profile');   
                cb(error,null);
           } 
           else{
               // General profile retrieved successfully
                    // retrieve person profile info
                findById(profile.profileInfo,function(error,personalInfo){
                    if(error){
                        // error finding personal info
                        console.log('error finding personal info');
                        cb(error,null);
                    }
                    else{
                        // personal info retrieved successfully
                        delete profile.profileInfo;
                        profile.person = personalInfo;
                        // everything is fine thus far
                        cb(null,profile);
                    }
                });
           }
       });
    },

    updateProfile : function(option,query,cb){
        personCollection.update(option,query,function(error){
           cb(error); 
        });
    }, 
}

module.exports = Person;