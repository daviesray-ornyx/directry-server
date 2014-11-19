var mongo =  require('mongodb');
var dbHost = '127.0.0.1';
var dbPort = mongo.Connection.DEFAULT_PORT;
db  = new mongo.Db('directry_dev', new mongo.Server('ds049180.mongolab.com','49180',{safe:false}));
db.open(function (error, db) {
    if (error) {
        console.log('Error: ' + error.message);
    }
    else {
        console.log('Connection To DB successfull!');
        //Authenticate
        db.authenticate("directry_admin", "directry_admin", function (err, res) {
            console.log("Successfully Authenticated!");
        });
    }
});
module.exports = db;