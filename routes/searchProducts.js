const express = require('express');
const router = express.Router();
const Product = require('../models/products'); 
const auth = require('../middlewares/auth');

router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required.' });
        }

        // const products = await Product.find({
        //     $or: [
        //         // regex este un operator MongoDB care specifica o expresie regulata pentru a cauta text 
        //         // `$options: 'i' este o optiune a expresiei regulate care indica ca cautarea trebuie sa fie case-insensitive (fara a tine cont de litere mari si mici).
        //         { title: { $regex: query, $options: 'i' } },
        //         { description: { $regex: query, $options: 'i' } }
        //     ]
        // });
        const products = await Product.find({ title: { $regex: query, $options: 'i' } });

        return res.status(200).json({
            message: 'Products found successfully',
            products
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while searching for products.' });
    }
});

module.exports = router;
