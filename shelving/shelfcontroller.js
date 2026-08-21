const Shelf = require('./shelfmodel');
const Category = require('../category/categoryModel'); // Adjust path to match your project layout

// Normalizes the shared shelf fields.
// - shelf_number: trim + uppercase (it's a physical location code, e.g. "a1 " -> "A1")
// - shelf_category: trim + lowercase
// - book_category: trim only — must match categories.category_subject's stored casing exactly
function normalizeShelfInput(body) {
    return {
        shelf_number: body.shelf_number?.trim().toUpperCase(),
        shelf_category: body.shelf_category?.trim().toLowerCase(),
        book_category: body.book_category?.trim(),
        status: body.status,
    };
}

exports.addShelf = (req, res) => {
    const { shelf_number, shelf_category, book_category } = req.body;

    if (!shelf_number || !shelf_category || !book_category) {
        return res.status(400).json({ message: "All shelf blueprint configuration metrics are required fields." });
    }

    const normalized = normalizeShelfInput(req.body);

    Shelf.findByNumber(normalized.shelf_number, (err, existingShelf) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existingShelf) {
            return res.status(400).json({ message: `Configuration conflict. Shelf number ${normalized.shelf_number} is already in use.` });
        }

        // Referential check: book_category must match a real category_subject
        Category.findBySubject(normalized.book_category, (err, existingCategory) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!existingCategory) {
                return res.status(400).json({ message: `Book category "${normalized.book_category}" does not match any registered category subject.` });
            }

            Shelf.create(normalized, (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ message: "Shelf added successfully!" });
            });
        });
    });
};

exports.getShelves = (req, res) => {
    const search = req.query.search || '';
    Shelf.findAll(search, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
};

exports.getShelfByNo = (req, res) => {
    const shelfNumber = req.params.shelf_number?.trim().toUpperCase();
    Shelf.findByNumber(shelfNumber, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(404).json({ message: "No physical shelf mapping tracking log found under that identifier." });
        res.status(200).json(result);
    });
};

exports.updateShelf = (req, res) => {
    // URL param is the CURRENT shelf_number (pre-rename identifier)
    const currentShelfNumber = req.params.shelf_number?.trim().toUpperCase();

    Shelf.findByNumber(currentShelfNumber, (err, existingShelf) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existingShelf) return res.status(404).json({ message: "Cannot complete update. Target shelf record does not exist." });

        // Fall back to existing values for any field the caller didn't send
        const normalized = {
            shelf_number: (req.body.shelf_number?.trim().toUpperCase()) || existingShelf.shelf_number,
            shelf_category: (req.body.shelf_category?.trim().toLowerCase()) || existingShelf.shelf_category,
            book_category: (req.body.book_category?.trim()) || existingShelf.book_category,
            status: req.body.status || existingShelf.status,
        };

        // If renaming, make sure the new shelf_number isn't already taken by a different shelf
        const isRenaming = normalized.shelf_number !== currentShelfNumber;

        const proceedWithCategoryCheck = () => {
            Category.findBySubject(normalized.book_category, (err, existingCategory) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!existingCategory) {
                    return res.status(400).json({ message: `Book category "${normalized.book_category}" does not match any registered category subject.` });
                }

                Shelf.update(currentShelfNumber, normalized, (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(200).json({ message: "Shelf mapping structural array adjustments recorded successfully!" });
                });
            });
        };

        if (isRenaming) {
            Shelf.findByNumber(normalized.shelf_number, (err, conflictingShelf) => {
                if (err) return res.status(500).json({ error: err.message });
                if (conflictingShelf) {
                    return res.status(400).json({ message: `Configuration conflict. Shelf number ${normalized.shelf_number} is already in use.` });
                }
                proceedWithCategoryCheck();
            });
        } else {
            proceedWithCategoryCheck();
        }
    });
};

exports.deleteShelf = (req, res) => {
    const shelfNumber = req.params.shelf_number?.trim().toUpperCase();

    Shelf.findByNumber(shelfNumber, (err, existingShelf) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existingShelf) return res.status(404).json({ message: "Cannot remove entry. Target shelf record not found." });

        Shelf.delete(shelfNumber, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "Shelf configuration removed from library indexing successfully." });
        });
    });
};