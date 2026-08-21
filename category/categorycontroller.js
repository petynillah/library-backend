const Category = require('./categoryModel');

exports.addCategory = (req, res) => {
  const { category_name, reading_level, category_subject } = req.body;

  // Presence check only — value restrictions (fiction/non-fiction, junior/senior)
  // are now enforced client-side, not here.
  if (!category_name || !reading_level || !category_subject) {
    return res.status(400).json({ message: "All classification data configuration inputs are required." });
  }

  const cleanCategoryName = category_name.trim().toLowerCase();
  const cleanReadingLevel = reading_level.trim().toLowerCase();
  const cleanCategorySubject = category_subject.trim();

  // Composite duplicate check: allow repeated names/subjects individually,
  // but block if the exact name + level + subject combination already exists
  Category.findOne({ 
    category_name: cleanCategoryName, 
    reading_level: cleanReadingLevel, 
    category_subject: cleanCategorySubject 
  }, (err, existingCat) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (existingCat) {
      return res.status(400).json({ 
        message: `Conflict. This exact combination of '${cleanCategoryName}' (${cleanReadingLevel}) for subject '${cleanCategorySubject}' is already registered.` 
      });
    }

    const normalizedData = {
      category_name: cleanCategoryName,
      reading_level: cleanReadingLevel,
      category_subject: cleanCategorySubject
    };

    Category.create(normalizedData, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "New book category registered successfully!" });
    });
  });
};

exports.getAllCategories = (req, res) => {
  const search = req.query.search || '';
  Category.findAll(search, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

// RENAMED from getCategoryByName -> keyed by category_id now
exports.getCategoryById = (req, res) => {
  Category.findById(req.params.category_id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ message: "Target category index does not exist in registry." });
    res.status(200).json(result);
  });
};

exports.processUpdateCategory = (req, res) => {
  const categoryId = req.params.category_id;

  Category.findById(categoryId, (err, existingCat) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existingCat) return res.status(404).json({ message: "Update rejected. Reference category target index not found." });

    // No enum validation here anymore — frontend is responsible for constraining
    // category_name / reading_level to allowed values before submitting.
    const updatedData = {
      category_name: req.body.category_name?.trim().toLowerCase() ?? existingCat.category_name,
      reading_level: req.body.reading_level?.trim().toLowerCase() ?? existingCat.reading_level,
      category_subject: req.body.category_subject?.trim() ?? existingCat.category_subject,
    };

    Category.update(categoryId, updatedData, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "Category parameters reconfigured successfully." });
    });
  });
};

exports.processDeleteCategory = (req, res) => {
  const categoryId = req.params.category_id;
  Category.delete(categoryId, (err, result) => {
    if (err) {
      if (err.parent && err.parent.errno === 1451 || err.message.includes('foreign key constraint fails')) {
        return res.status(400).json({ 
          error: "DENIED", 
          message: `Cannot delete this category because it is currently assigned to physical shelves on the library floor. Reassign or delete those shelves first.` 
        });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Category removed from global index system routing." });
  });
};