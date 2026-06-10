const express= require("express");
const router = express.Router();

const {addCategory,getAllCategories,getCategoryById,
    updateCategory,deleteCategory} = require("../category/categorycontroller.js");

router.post("/category",addCategory);
router.get("/category",getAllCategories);
router.get("/category/:catID",getCategoryById);
router.put("/category/:catID",updateCategory);
router.delete("/category/:catID",deleteCategory);

module.exports =router;