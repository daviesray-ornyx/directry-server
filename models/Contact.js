var db = require('../db');
var contactCollection = db.collection('contact');

var Contact = {

    initialize : function(cb){
        contactCollection.insert({Mobile : [], Telephone : [], Email : [], Pager : []}, {w: 1}, function(error,results){
            console.dir(results[0]);
            cb(error,results[0]);   
        });
    },

    findById : function(id,cb){
        contactCollection.findOne({_id : id},function(error,contact){
            if(error) {
                // error occured while retrieving contact
                console.log('error occured while retrieving contact');
                cb(error,null);
            }
            else{
                cb(null,contact);
            }
        });
    },

    update : function(option,query,cb){
        contactCollection.update(option,query,function(error){
           cb(error); 
        });
    },

}
module.exports = Contact;