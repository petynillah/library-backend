const mysql = require("mysql2");

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    database:"library"
});
db.connect((err) =>{
    if(err){
        console.log("Database connection failed",err)
    }else{
        console.log("connected to mysql")
    };
});

module.exports= db;