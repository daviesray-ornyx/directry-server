
/*
 * GET home page.
 */
var Institution = require('../models/Institution');
 

var institutionRoutes = {
        
    getProfile : function(req,res){
        if(!req.isAuthenticated){
            res.send('Sorry sir/madam.... You are not authenticated');
            res.redirect('/');  // this is an api, we do not redirec, just send status and message
        }
        else{
            // Retrieve parameter
                // In this case, username
             var username = req.param('username');
             Institution.getProfile(username,function(error,profile){
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
    
    updateName : function(req,res){
        if(req.isAuthenticated){
            var name = req.param('name');
            var updateOption = {_id:req.user.profileInfo};
            var updateQuery = {$set: {name : name}};
            Institution.updateProfile(updateOption,updateQuery,function(error){
                if(error){
                    console.log('Error updating user Name');
                    res.send('Error updating user Name');
                }
                else{
                    console.log('Name Updated Successfully');
                    res.send('Name Updated Successfully');
                }
            });
        }
        else{
            // user not authenticated
                // return this message
            res.send('user not authenticated');
        }
    },
    
    updateLogo : function(req,res){
        if(req.user.userType == 'institution'){
            if(req.isAuthenticated){
                var imageMetaData = req.files.logo;
                var image = fs.readFileSync(imageMetaData.path);
                var updateOption = {_id:req.user.profileInfo};
                var updateQuery = {$set: {logo : image,logoImageType : imageMetaData.type, logoImageName : imageMetaData.name}}
            
                Institution.updateProfile(updateOption,updateQuery,function(error){
                    if(error){
                        res.send('Error uploading Logo');
                    }
                    else{
                        res.send('Logo Successfully Updated');
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
    
    /*addPhoto : function(req,res){
        
    },

    removePhoto : function(req,res){

    },

    addWorker : function(req,res){

    },

    removeWorker : function(req,res){

    },

    addOwner : function(req,res){

    },

    removeOwner : function(req,res){

    },
    */
    listInstitutions : function(req,res){
        var query = {userType : 'institution'};
        var User = require('../models/User');
        User.find(query,function(error,userList){
            if(error){
                res.send('Error retrieving user list');
            }
            else{
                res.json(userList);
            }
        });
    }
}

module.exports = institutionRoutes;