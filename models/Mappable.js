var db = require('../db');
var mappableCollection = db.collection('mappable');

var Mappable = {

    initialize : function(cb){
        mappableCollection.insert({visibility : 'visible', iconImageName : '', mappableType : '', location : {longitude : '', latitude : ''}}, { w:1}, function(error,results){        
            // Note that icon is always stored on the client side
            cb(error,results[0]);   
        });
    },

    findById : function(id,cb){
        mappableCollection.findOne({_id : id},function(error,mappable){
            if(error) {
                // error occured while retrieving contact
                console.log('error occured while retrieving Mapping Info');
                cb(error,null);
            }
            else{
                cb(null,mappable);
            }
        });
    },

    update : function(option,query,cb){
        mappableCollection.update(option,query,function(error){
           cb(error); 
        });
    },

    set : function(collection,userId,mappalbe,cb){
        /*
            setting mappable options
        */
    },

    setLocation : function(collection,userId,location,cb){
        /*
            change location for th euser and execute callback method on completion
        */

    },

    getLocation : function(collection,userId,cb){
        

    },

    toggleVisibility : function(collection,userId,cb){
        

    },

    setType : function(collection,userId,newType,cb){
        

    },

    setIcon : function(collection,userId,icon,cb){
        

    },

    getType : function(collection,userId,cb){
        

    }

}
module.exports = Mappable
