//import
const db = require("../configuration/db")

//add a book
const addBook=(req,res) =>{
    const {author, bookTiltle, isbn} =req.body;
    const sql = "INSERT INTO books(author, bookTiltle, isbn) VALUES (? ,? ,?)";
    db.query(sql, [author, bookTiltle, isbn], (err,result) =>{
        if(err) return res.status(404).json(err);
        return res.status(201).json({message:"Book added"});
    });
};

//get all book
const getAllBooks=(req, res) =>{
    db.query("SELECT * FROM books",(err, result) =>{
        if(err) return res.status(500).json(err);
        return res.json(result);
    });
};

//get a book
const getBookById =(req,res) =>{
    const sql ="SELECT * FROM books where isbn =?"
    db.query(sql, [req.params.isbn], (err, result) =>{
      if(err) return res.status(500).json(err);
      if(result.length===0)
        return res.status(404).json({message:"Not found"});
      return res.json(result[0]);
    });
};

//update book
const updateBook =(req, res) =>{
    const {author, bookTiltle}=req.body;
    const sql="UPDATE books SET author=?, bookTiltle=? WHERE isbn=?";

    db.query(sql,[author, bookTiltle, req.params.isbn],(err, result)=>{
        if(err) return res.status(500).json(err);
        return res.json({message:"Student updated"});
    });
};

//delete
const deleteBook =(req,res)=>{
    const sql="DELETE from books WHERE isbn=?";
    db.query(sql, [req.params.isbn],(err,result)=>{
        if(err) return res.status(500).json(err);
        return res.json({message:"Student deleted"});
    });
};

module.exports={
    addBook,getAllBooks,getBookById,updateBook,deleteBook
};