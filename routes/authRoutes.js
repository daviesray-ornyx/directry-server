
/*
 * GET home page.
 */
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var User = require('../models/User');

 

function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
}

function updatePasswordResetCode(username,next){
    // Generate password reset code and expiry date 
    var code = randomValueHex(4);
    console.log('Password reset code for ' + username + ' is: ' + code);
    bcrypt.hash(code, null, null, function(error, hash) {
        if(error){
            // error hashing password
            next(error,null);       // we return the error
        }
        else{                    
            var expiryDate = Date.now() + 86400000;        
            // store hash in the db. Note, we also need to add expiry date during which the code can be used
            var userCollection = db.collection('users');
            User.update({username:username},{$set: {passwordResetCode : hash,resetPasswordExpiryDate : expiryDate}}, function(error){
                next(error,{'Code':code,'Hash':hash, 'Expiry Date' : new Date(expiryDate)}); // we return null for error and code and hash
            });                                
        }
    }); 
}

var userRoutes = {
    index: function (req, res) {
        res.send('Welcome to index');
    },

    register: function (req, res) {
        // retrieve request data, ensure everything required is provided
        var username = req.body.username;   // this is your username
        var password = req.body.password;
        var userType = req.body.userType;  // institution || person
        if (username != null && password != null) {
            // check if user is in db already
            User.findByUsername(username, function (error, user) {
                if (error) {
                    res.send('Error registering user, error finding user in db');
                }
                else if (user) {
                    // User already exists in the db
                    res.send('Error registering user. User with specified username exists already');
                }
                else {
                    //This is a new user
                    // add user details to db
                    bcrypt.hash(password, null, null, function (error, hash) {
                        if (error) {
                            // error hashing password
                            res.send('Error registering user. error hashing password');
                        }
                        else {
                            var user = {
                                userType: userType,
                                username: username,
                                password: hash,
                                passwordResetCode: '',
                                status: 'active'
                            }
                            User.insert(user, function (err, users) {
                                if (err) {
                                    res.statusCode = 400;
                                    res.send('Error registering user. Adding user to db');
                                }
                                else {
                                    
                                    // we need to return user details... this is because the next step is to take user to the profile page
                                    if (userType == 'institution') {
                                        // retrieve institution profile
                                        // retrieve person profile
                                        var institution = require('../models/Institution');
                                        institution.getProfile(username, function (error, profile) {
                                            if(error){
                                                res.statusCode = 400;
                                                res.send('Error retrieving profile');
                                            }
                                            else{
                                                res.statusCode = 200;
                                                 res.send(profile);
                                            }
                                        });
                                    }
                                    else if (userType == 'person') {
                                        // retrieve person profile
                                        var person = require('../models/Person');
                                        person.getProfile(username, function (error, profile) {
                                            if(error){
                                                res.statusCode = 400;
                                                res.send('Error retrieving profile');
                                            }
                                            else{
                                                res.statusCode = 200;
                                                 res.send(profile);
                                            }
                                        });
                                    }                                   
                                }
                            });
                        }

                    });
                }

            });
        }
        else {
            res.send('Error registering user. Missing data');
        }




        // do login automatically
    },

    login: function (req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var userCollection = db.collection('users');
        User.authenticate({username: username, password: password }, function (error, user) {
            if (error) {
                res.statusCode = 400;
                res.send('Login error');
            }
            else if (!user) {
                // User already exists in the db
                res.statusCode = 400;
                res.send('Invalid username and or password');
            }
            else {
                //Success
                // we need to return user details... this is because the next step is to take user to the profile page
                                    if (user.userType == 'institution') {
                                        // retrieve institution profile
                                        // retrieve person profile
                                        var institution = require('../models/Institution');
                                        institution.getProfile(username, function (error, profile) {
                                            if(error){
                                                res.statusCode = 400;
                                                res.send('Error retrieving profile');
                                            }
                                            else{
                                                res.statusCode = 200;
                                                 res.send(profile);
                                            }
                                        });
                                    }
                                    else if (user.userType == 'person') {
                                        // retrieve person profile
                                        var person = require('../models/Person');
                                        person.getProfile(username, function (error, profile) {
                                            if(error){
                                                res.statusCode = 400;
                                                res.send('Error retrieving profile');
                                            }
                                            else{
                                                res.statusCode = 200;
                                                 res.send(profile);
                                            }
                                        });
                                    }           
            }

        });
    },

    logout: function (req, res) {
        // change user status
        // ideally, this should also appen in the client(first and foremost)
        req.isAuthenticated = false;
        req.logout();   // this is to logout the current user
    },

    requestPasswordResetCode: function (req, res) {
        var username = req.param('username');
        if (username && username != '') {
            updatePasswordResetCode(username, function (error, result) {
                if (error) {
                    res.send('Error generating Password Reset Code');
                }
                else {
                    res.send(result);
                }
            });
        }
        else {
            res.send('No username entered');
        }
    },

    resetPassword: function (req, res) {
        // retrieve parameters and ensure every required detail is provided
        var username = req.body.username;   // this is your username
        var resetCode = req.body.resetCode;
        var password = req.body.password;
        var confirmPassword = req.body.confirmPassword;
        if (username != null && password != null && resetCode != null && confirmPassword != null) {
            if (password == confirmPassword) {
                // check is username is in db
                User.findByUsername(username, function (error, user) {
                    if (error) {
                        res.send('Error Retrieving user');
                    }
                    else if (!user) {
                        // User already exists in the db
                        res.send('Error : No user with given username');
                    }
                    else {
                        //User exists
                        // check if resetcode has expired
                        if (Date.now() > user.resetPasswordExpiryDate) {
                            // reset code has expired. Tell user and give new code
                            updatePasswordResetCode(req.body.username, function (error, result) {
                                if (error) {
                                    res.send('Error generating Password Reset Code');
                                }
                                else {
                                    res.send({ 'Message': 'Your Password reset code has expired.', 'The new details: ': result });
                                }
                            });
                        }
                        else {
                            // Paswword reset code still valid
                            // check if it matches what was provided
                            bcrypt.compare(resetCode, user.passwordResetCode, function (err, success) {
                                if (success) {
                                    console.log('Provided code matches, update password');
                                    // hash the new password
                                    bcrypt.hash(password, null, null, function (error, hash) {
                                        if (error) {
                                            // error hashing password
                                            res.send('Error hashing the new password');
                                        }
                                        else {
                                            // update details
                                            User.update({ username: username }, { $set: { passwordResetCode: '', resetPasswordExpiryDate: '', password: hash} }, function (error) {
                                                if (error) {
                                                    res.send('Password Reset Failed!!');
                                                }
                                                else {
                                                    res.send('Password successfully reset');
                                                }
                                            });
                                        }
                                    });
                                }
                                else {
                                    // authentication failed
                                    console.log('Provided code does not match, return message');
                                    res.send('Provided code does not match x more attempts before password is reset');
                                }

                            });
                        }
                    }
                });
            }
            else {
                // pasword not equal to reset password
                res.send('Password and confirm password different!');
            }
        }
        else {
            res.send('Some details missing');
        }
    },

    findUser: function (req, res) {
        // Retrieve parameters
        var username = req.param('username');
        // find user with given username
        User.findByUsername(username, function (error, user) {
            if (error) {
                console.log('Error retrieving user!!');
                res.send('Error retrieving user!!');
            }
            else if (!user) {
                // no user with specified username
                console.log('No user with specified username!!');
                res.send('No user with specified username!!');
            }
            else {
                res.send(user);
            }
        });

    },

    getContact: function (req, res) {
        // get a given user's contact
        var username = req.param('username');
        if (!username || username == '') {
            res.send('User not enterd');
        }
        else {
            // get user
            User.findByUsername(username, function (error, user) {
                if (error) {
                    console.log('Errror finding user');
                    res.send('Errror finding user');
                }
                else if (!user) {
                    // No such user in system
                    console.log('No such user in system');
                    res.send('No such user in system');
                }
                else {
                    // user found
                    // get contact 
                    var Contact = require('../models/Contact');
                    Contact.findById(user.contactInfo, function (error, contact) {
                        if (error) {
                            res.send('Error retrieving contact');
                        }
                        else {
                            res.send(contact);
                        }
                    });
                }
            });
        }
    },

    addContact: function (req, res) {
        if (req.isAuthenticated) {
            var Contact = require('../models/Contact');

            var type = req.param('type');
            var value = req.param('value');
            var option = { _id: req.user.contactInfo };
            var query = '';

            Contact.findById(req.user.contactInfo, function (error, contact) {
                if (error) {
                    res.send('Error retrieving contact Information');
                }
                else {
                    switch (type) {
                        case 'mobile':
                            contact.Mobile.push(value);
                            break;
                        case 'telephone':
                            contact.Telephone.push(value);
                            break;
                        case 'email':
                            contact.Email.push(value);
                            break;
                        case 'pager':
                            contact.Pager.push(value);
                            break;
                        default:
                            res.send('Invalid option');
                            break;
                    }
                    // update details
                    //delete _id
                    delete contact._id;
                    query = { $set: contact };
                    Contact.update(option, query, function (error) {
                        if (error) {
                            res.send('Error Updating Contact');
                        }
                        else {
                            res.send('Contact Successfully Updated');
                        }
                    });
                }
            });
        }
        else {
            res.send('User not authenticated!!');
        }
    },

    removeContact: function (req, res) {
        if (req.isAuthenticated) {
            var Contact = require('../models/Contact');

            var type = req.param('type');
            var value = req.param('value');
            var option = { _id: req.user.contactInfo };
            var query = '';

            Contact.findById(req.user.contactInfo, function (error, contact) {
                if (error) {
                    res.send('Error retrieving contact Information');
                }
                else {
                    switch (type) {
                        case 'mobile':
                            var index = contact.Mobile.indexOf(value);
                            if (index > -1) {
                                contact.Mobile.splice(index, 1);
                            }
                            break;
                        case 'telephone':
                            var index = contact.Telephone.indexOf(value);
                            if (index > -1) {
                                contact.Telephone.splice(index, 1);
                            }
                            break;
                        case 'email':
                            var index = contact.Email.indexOf(value);
                            if (index > -1) {
                                contact.Email.splice(index, 1);
                            }
                            break;
                        case 'pager':
                            var index = contact.Pager.indexOf(value);
                            if (index > -1) {
                                contact.Pager.splice(index, 1);
                            }
                            break;
                        default:
                            res.send('Invalid option');
                            break;
                    }
                    // update details
                    //delete _id
                    delete contact._id;
                    query = { $set: contact };
                    Contact.update(option, query, function (error) {
                        if (error) {
                            res.send('Error Updating Contact');
                        }
                        else {
                            res.send('Contact Successfully Updated');
                        }
                    });
                }
            });
        }
        else {
            res.send('User not authenticated!!');
        }
    },

    getMappable: function (req, res) {
        // get a given user's contact
        var username = req.param('username');
        if (!username || username == '') {
            res.send('User not entered');
        }
        else {
            // get user
            User.findByUsername(username, function (error, user) {
                if (error) {
                    console.log('Errror finding user');
                    res.send('Errror finding user');
                }
                else if (!user) {
                    // No such user in system
                    console.log('No such user in system');
                    res.send('No such user in system');
                }
                else {
                    // user found
                    // get contact 
                    var Mappable = require('../models/Mappable');
                    Mappable.findById(user.mappableInfo, function (error, mappable) {
                        if (error) {
                            res.send('Error retrieving contact');
                        }
                        else {
                            res.send(mappable);
                        }
                    });
                }
            });
        }
    },

    setLocation: function (req, res) {
        if (req.isAuthenticated) {
            var Mappable = require('../models/Mappable');

            var longitude = req.param('longitude');
            var latitude = req.param('latitude');
            var option = { _id: req.user.mappableInfo };
            var query = '';

            Mappable.findById(req.user.mappableInfo, function (error, mappable) {
                if (error) {
                    res.send('Error retrieving Map Information');
                }
                else if (!mappable) {
                    // No matching mappable found
                    res.send('No matching mappable found!!');
                }
                else {
                    mappable.location.longitude = longitude;
                    mappable.location.latitude = latitude;
                    query = { $set: mappable };
                    Mappable.update(option, query, function (error) {
                        if (error) {
                            res.send('Error Updating Mappable');
                        }
                        else {
                            res.send('Mappable Successfully Updated');
                        }
                    });
                }
            });
        }
        else {
            res.send('User not authenticated!!');
        }
    },

    setMappableType: function (req, res) {
        if (req.isAuthenticated) {
            var Mappable = require('../models/Mappable');

            var mappableType = req.param('mappableType');
            var option = { _id: req.user.mappableInfo };
            var query = '';

            Mappable.findById(req.user.mappableInfo, function (error, mappable) {
                if (error) {
                    res.send('Error retrieving Map Information');
                }
                else if (!mappable) {
                    // No matching mappable found
                    res.send('No matching mappable found!!');
                }
                else {
                    mappable.mappableType = mappableType;
                    mappable.iconImageName = mappableType;
                    query = { $set: mappable };
                    Mappable.update(option, query, function (error) {
                        if (error) {
                            res.send('Error Updating Mappable');
                        }
                        else {
                            res.send('Mappable Type Successfully Updated');
                        }
                    });
                }
            });
        }
        else {
            res.send('User not authenticated!!');
        }
    }
}

module.exports = userRoutes;