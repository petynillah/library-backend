//initialize
const express =require("express");
const app =express();

app.use(express.json());

const bookRoute = require("./books/route/bookRoute.js");

app.use("", bookRoute);

//category

const categoryRoute = require("./category/categoryRoute.js")
app.use("",categoryRoute);

//app listen
const port =6000;
app.listen(port,() =>{
    console.log(`server running on port ${port}`)
});