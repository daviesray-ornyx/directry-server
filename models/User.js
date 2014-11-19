//fs = require("fs");
var db = require('../db');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
    //var mappable = require('./Mappable.js');
var Contact = require('./Contact');
var Person = require('./Person.js');
var Institution = require('./Institution');
var Mappable = require('./Mappable.js');
var userCollection = db.collection('users');


function createProfile(userType, cb){
    switch(userType) {
        case 'person':
            Person.initialize(cb);
            break;
        case 'institution':
            Institution.initialize(cb);
            break;
    }
}

function publicize(user, cb) {
    try{
        delete user.password;
        delete user.passwordResetCode;
        delete user.resetPasswordExpiryDate;
        // user successfully made public
        cb(null, user);
    }
    catch (exception) {
        // error while deleting private user properties
        cb(exception,null);
    }
}

var User = {
        
    findAll : function(cb){
        userCollection.find({}).toArray(function(error,userList){
            cb(error,userList);
        });
    },

    findByUsername : function(username,cb){
        userCollection.findOne({username : username},function(error,user){
            cb(error,user);
        });

    },
    
    find : function(query,cb){
        userCollection.findAll(query).toArray(function(error,userList){  // this was find one, has been changed to find.... If any other areas are affected, update this appropriately
            cb(error,userList);
        });
    },

    authenticate: function (authObject, cb) {        
        userCollection.findOne({username : authObject.username},function(error,user){
            //cb(error,user);
            if(error){ 
                console.log('Error retrieving user');
                cb(error,null);
            }
            else if(!user){ 
                console.log('No user found');
                cb(null,null);
            }
            else{
                bcrypt.compare(authObject.password, user.password, function(err, res) {
                    if(res){
                        // user authenticated
                        console.dir(user);
                        console.log('User has been authenticated!!');
                        cb(null, user);
                    }
                    else{
                        // authentication failed
                        console.log('Authentication failed');
                        cb(error,null);
                    }

                });
                   
                    
            } 
        });
    },
    
    insert: function (user, cb) {   // new user into db
        Contact.initialize(function (error, contact) {
            if (error) {
                console.log('Error initializing contact');
                cb(error,null);     // return error and a null user
            }
            else {
                user.contactInfo = contact._id;
                createProfile(user.userType,function(error,profile){
                    if (error) {
                        cb(error, null);
                    }
                    else {
                        user.profileInfo = profile._id;
                        Mappable.initialize(function (error, mappable) {
                            if (error) {
                                cb(error, mappable);
                            }
                            else {
                                user.mappableInfo = mappable._id;
                                //Save user details
                                userCollection.insert(user, function (error, user) {
                                    if (error) {
                                        console.log('Error saving user: ' + error);
                                        cb(error, null);
                                    }
                                    else {
                                        cb(null, user);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    update : function(option,query,cb){    // modify existing user details
        userCollection.update(option,query, function (error) {
            cb(error); 
         });
    },
    
    getGenUserProfile : function (username, cb) {
        this.findByUsername(username, function (error, user) {
            if (error) {
                // error occurred while retrieving user details
                cb(error, null);
            }
            else {
                // delete private user properties
                publicize(user, function (errror, user) {
                    if (error) {
                        // error while making user public
                        cb(error, null);
                    }
                    else {
                        // user successfully made public
                        //   NEXT get contact details
                        Contact.findById(user.contactInfo, function (error, contact) {
                            if (error) {
                                // error finding contact
                                // task for future, if error or !contact create contact document and assign it to user
                                cb(error, null);
                            }
                            else {
                                delete user.contactInfo;    // not needed anymore
                                user.contact = contact;
                                // NEXT get 
                                Mappable.findById(user.mappableInfo, function (error, mappable) {
                                    if (error) {
                                        // task for future, if error or !mappable create mappable document and assign it to user
                                        cb(error, null);
                                    }
                                    else {
                                        delete user.mappableInfo; // not needed anymore
                                        user.mappable = mappable;
                                        cb(null, user);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    
};

module.exports = User;