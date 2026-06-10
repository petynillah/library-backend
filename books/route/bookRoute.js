const express =require("express");
const router = express.Router(); 

const{addBook,getAllBooks,getBookById,updateBook,deleteBook}=
require("../controller/bookController")

  //books
router.post("/books",addBook);
router.get("/books",getAllBooks);
router.get("/books/:isbn",getBookById);
router.put("/books/:isbn",updateBook);
router.patch("/books/:isbn",deleteBook);



module.exports= router;