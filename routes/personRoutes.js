
/*
 * GET home page.
 */
var Person = require('../models/Person');
 

var personRoutes = {
        
    getProfile : function(req,res){
        if(!req.isAuthenticated){
            res.send('Sorry sir/madam.... You are not authenticated');
            res.redirect('/');  // this is an api, we do not redirec, just send status and message
        }
        else{
            // Retrieve parameter
                // In this case, username
             var username = req.param('username');
             Person.getProfile(username,function(error,profile){
                 if(error){
                     console.log('Failed to retrieve profile details!!');
                     res.send('Failed to retrieve profile details!!');
                 }
                 else{
                     console.log('Profile details successfully retrieved!!');
                     res.send(profile);
                 }     
             });
            
        }
    },
    
    updateFullName : function(req,res){
        if(req.isAuthenticated){
            var fullName = req.param('fullName'); 
            var updateOption = {_id:req.user.profileInfo};
            var updateQuery = {$set: {fullName : fullName}};
            Person.updateProfile(updateOption,updateQuery,function(error){
                if(error){
                    console.log('Error updating user Full Name');
                    res.send('Error updating user Full Name');
                }
                else{
                    console.log('Full Name Updated Successfully');
                    res.send('Full Name Updated Successfully');
                }
            });
        }
        else{
            // user not authenticated
                // return this message
            res.send('user not authenticated');
        }
    },
    
    updateProfilePic : function(req,res){
        if(req.user.userType == 'person'){
            if(req.isAuthenticated){
                var imageMetaData = req.files.ppic;
                var image = fs.readFileSync(imageMetaData.path);
                var updateOption = {_id:req.user.profileInfo};
                var updateQuery = {$set: {profilePic : image,profilePicImageType : imageMetaData.type, profilePicImageName : imageMetaData.name}}
            
                Person.updateProfile(updateOption,updateQuery,function(error){
                    if(error){
                        res.send('Error uploading profile pic');
                    }
                    else{
                        res.send('Profile Pic Successfully Updated');
                    }
                });
            }
            else{
                // user not authenticated, redirect to index
                res.send('User not authenticated');
            }
        }
        else{
            res.send('Wrong path for this user type');
        }
    },
    
    /*addWorkPlace : function(req, res){

    },

    removeWorkPlace : function(req,res){

    },

    addOwned : function(req,res){

    },

    removeOwned : function(req, res){

    },
    */
    listPeople : function(req,res){
        var User = require('../models/User');
        var query = {userType : 'person'};
        User.find(query,function(error,userList){
            if(error){
                res.send('Error retrieving user list ama niaje?');
            }
            else{
                res.json(userList);
            }
        });
    }
}

module.exports = personRoutes;