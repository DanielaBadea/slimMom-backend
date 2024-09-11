const express = require('express');
const router = express.Router();
const Diary = require('../models/diary');
const Product = require('../models/products');
const auth = require('../middlewares/auth');  
const { startOfDay, endOfDay } = require('date-fns');


//  Crearea unui endpoint pentru a adăuga un produs consumat într-o anumită zi.
router.post('/consumed', auth, async (req, res) => {
    try {
        const { productId, product_weight } = req.body;
        const userId = req.user._id;

        if (!productId || !product_weight) {
            return res.status(400).json({ message: "Product ID and weight are required" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const product_Calories = (product.calories * product_weight) / 100;

        //gasim/cream un jurnal pentru utilizator
        let diaryEntry = await Diary.findOne({ userId });

        if (!diaryEntry) {
            diaryEntry = new Diary({ userId, entries: [] });
        }

        // verific data curenta
        const today = new Date().toDateString();

        //  indexul intrarii existente pentru produsul consumat in acea zi
        const entryIndex = diaryEntry.entries.findIndex(entry => 
            entry.productId.toString() === productId.toString() &&
            new Date(entry.date).toDateString() === today
        );

        if (entryIndex > -1) {
            // actualizez intrarea existenta
            diaryEntry.entries[entryIndex] = {
                productId,
                product_weight,
                product_Calories,
                date: new Date()
            };
        } else {
            diaryEntry.entries.push({
                productId,
                product_weight,
                product_Calories,
                date: new Date()
            });
        }

        await diaryEntry.save();

        return res.status(201).json({
            message: "Consumed product added/updated successfully",
            diaryEntry
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error adding/updating consumed product" });
    }
});


// Crearea unui endpoint pentru a șterge un produs consumat într-o anumită zi.
router.delete('/remove/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const diaryEntry = await Diary.findOne({ userId });

        if (!diaryEntry) {
            return res.status(404).json({ message: "Diary not found!" });
        }

        const entryIndex = diaryEntry.entries.findIndex(entry => 
            entry.productId.toString() === productId.toString() &&
            new Date(entry.date).toDateString() === new Date().toDateString()
        );

        if (entryIndex === -1) {
            const product = await Product.findById(productId);
            const productTitle = product ? product.title : 'unknown product';
            
            return res.status(404).json({ message: `Product ${productTitle} not found in diary!` });
        }

        diaryEntry.entries.splice(entryIndex, 1);
        await diaryEntry.save();

        return res.status(200).json({ message: "Consumed product removed successfully!" });

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ error: 'Failed to delete product!' });
    }
});



// Crearea unui endpoint pentru a primi toate informațiile despre o anumită zi.
router.get('/consumed/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user._id;

        // transormam data primita intr-un obiect Date
        const startDate = startOfDay(new Date(date));
        const endDate = endOfDay(new Date(date));

        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);

        // Caut toate intrarile din jurnal pentru utilizatorul curent si data specificata
        const diaryEntries = await Diary.findOne({
            userId,
            'entries.date': {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('entries.productId');

        if (!diaryEntries) {
            return res.status(404).json({ message: "No diary entry found for this date." });
        }

        return res.status(200).json({
            date,
            consumedProducts: diaryEntries.entries
        });
    } catch (error) {
        console.error("Error fetching consumed products:", error);
        return res.status(500).json({ message: "Error fetching consumed products" });
    }
});


module.exports = router;





// __________________________________________________________________________________________________________________________

// router.post('/consumed', auth, async (req, res) => {
//     try {
//         const { productId, product_weight } = req.body;
//         // Datele utilizatorului din middleware-ul auth
//         const userId = req.user._id;

//         if (!productId || !product_weight) {
//             return res.status(400).json({ message: "Product ID and weight are required" });
//         }

//         // caut produsul după ID
//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: "Product not found" });
//         }

//         // Calc. caloriile consumate pe baza greutatii introduse si a caloriilor per 100g din baza de date
//         const product_Calories = (product.calories * product_weight) / 100;

//         const diaryEntry = new Diary({
//             userId,
//             productId,
//             product_weight,
//             product_Calories
//         });

//         await diaryEntry.save();

//         // Populam detaliile prod. consumat pentru a include toate info.
//         const populatedDiaryEntry = await diaryEntry.populate('productId');

//         return res.status(201).json({
//             message: "Consumed product added successfully",
//             consumedProduct: populatedDiaryEntry
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Error adding consumed product" });
//     }
// });

// router.post('/consumed', auth, async (req, res) => {
//     try {
//         const { productId, product_weight } = req.body;
//         const userId = req.user._id;

//         if (!productId || !product_weight) {
//             return res.status(400).json({ message: "Product ID and weight are required" });
//         }

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: "Product not found" });
//         }

//         const product_Calories = (product.calories * product_weight) / 100;

//         // gasim/cream un jurnal pentru utilizator
//         let diaryEntry = await Diary.findOne({ userId });
//         console.log("Diary entry:", diaryEntry);

//         if (!diaryEntry) {
//             diaryEntry = new Diary({ userId, entries: [] });
//         }

//         diaryEntry.entries.push({
//             productId,
//             product_weight,
//             product_Calories
//         });

//         await diaryEntry.save();

//         return res.status(201).json({
//             message: "Consumed product added successfully",
//             diaryEntry
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Error adding consumed product" });
//     }
// });

// router.delete('/remove/:productId', auth, async (req, res) => {
//     try {
//         const { productId } = req.params;
//         const userId = req.user._id;

//         // gasim intrarea in jurnal bazata pe userId si productId
//         const diaryEntry = await Diary.findOne({ userId, productId });
//         console.log('Diary Entry:', diaryEntry.blue);

//         if (!diaryEntry) {
//             return res.status(404).json({ message: "Diary entry for this product not found!" });
//         }

//         await diaryEntry.remove();

//         return res.status(200).json({ message: "Consumed product removed successfully!" });
        
//     } catch (error) {
//         console.error("Error deleting product:", error);
//         return res.status(500).json({ error: 'Failed to delete consumed product!' });
//     }
// });
