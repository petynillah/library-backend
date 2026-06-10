const db = require("../books/configuration/db");

//add
const addCategory=(req, res)=>{
    const {catSection, catSubject, catID} =req.body;
    const sql ="insert into category(catSection, catSubject, catID) values(? ,? ,?)"
    db.query(sql, [catSection, catSubject, catID], (err,result)=>{
        if(err) return res.status(500).json(err);
          res.json(result);
    });
};

//print all
const getAllCategories=(req,res)=>{
    db.query("select * from category",[req.params], (err, result)=>{
        if(err) return res.status(500).json(err);
          res.json(result);
    });
};

//get an id
const getCategoryById = (req, res) => {
    const sql = "select * from category where catID = ?";
    db.query(sql, [req.params.catID], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0)
            return res.status(404).json({ message: "Not found" }); // ✅ res.status
        res.json(result[0]);
    });
};


//update
const updateCategory=(req,res)=>{
    const {catSection, catSubject}=req.body;
    const sql="update category set catSection=?, catSubject=? where catID=?"
    db.query(sql,[catSection, catSubject, req.params.catID],(err, result)=>{
        if(err) return res.status(500).json(err);
          res.json({message:"Category updated"});
    });
};

//delete
const deleteCategory=(req,res)=>{
    const sql="delete from category where catID=?";
    db.query(sql,[req.params.catID],(err,result)=>{
        if(err) return res.status(500).json(err);
          res.json({message:"Category deleted"});
    });
};


module.exports ={
    addCategory,getAllCategories,getCategoryById,updateCategory,deleteCategory
};