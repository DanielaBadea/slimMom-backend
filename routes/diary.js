const express = require('express');
const router = express.Router();
const Diary = require('../models/diary');
const Product = require('../models/products');
const auth = require('../middlewares/auth');  
// const { startOfDay, endOfDay } = require('date-fns');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "5d51694802b2373622ff5530"
 *         categories:
 *           type: string
 *           example: "eggs"
 *         weight:
 *           type: number
 *           example: 100
 *         title:
 *           type: string
 *           example: "Omelet with cheese"
 *         calories:
 *           type: number
 *           example: 342
 *         groupBloodNotAllowed:
 *           type: array
 *           items:
 *             type: boolean
 *           example: [null, true, true, true, true]
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     DiaryEntry:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           example: "60c72b2f9b1e8d001f64760b"
 *         product_weight:
 *           type: number
 *           example: 150
 *         product_Calories:
 *           type: number
 *           example: 404
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2024-09-12T00:00:00.000Z"
 *     Diary:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "60c72b2f9b1e8d001f64760b"
 *         entries:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiaryEntry'
 */

/**
 * @swagger
 * /api/diary/consumed:
 *   post:
 *     summary: Add a consumed product for the current day
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "60c72b2f9b1e8d001f64760b"
 *               product_weight:
 *                 type: number
 *                 example: 150
 *             required:
 *               - productId
 *               - product_weight
 *     responses:
 *       201:
 *         description: Successfully added/updated consumed product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Consumed product added/updated successfully"
 *                 diaryEntry:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "66e05e3f00b70bb9b3c184ec"
 *                     userId:
 *                       type: string
 *                       example: "66e05e3f00b70bb9b3c184cc"
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DiaryEntry'
 *       400:
 *         description: Product ID and weight are required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product ID and weight are required"
 *       500:
 *         description: Error adding/updating consumed product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error adding/updating consumed product"
 */

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
        let diaryEntry = await Diary.findOne({ userId }).populate({
            path: 'entries.productId', 
            select: 'title' 
        });

        if (!diaryEntry) {
            diaryEntry = new Diary({ userId, entries: [] });
        }

        const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

        //  indexul intrarii existente pentru produsul consumat in acea zi
        const entryIndex = diaryEntry.entries.findIndex(entry => 
            entry.productId.toString() === productId.toString() &&
            new Date(entry.date).toISOString().startsWith(today.toISOString().split('T')[0])
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

/**
 * @swagger
 * /api/diary/remove/{date}/{productId}:
 *   delete:
 *     summary: Remove a consumed product from the diary for a specific date
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: date
 *         in: path
 *         required: true
 *         description: The date of the diary entry from which the product will be removed
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2024-09-10T00:00:00.000Z"
 *       - name: productId
 *         in: path
 *         required: true
 *         description: ID of the product to remove
 *         schema:
 *           type: string
 *           example: "60c72b2f9b1e8d001f64760b"
 *     responses:
 *       200:
 *         description: Successfully removed consumed product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Consumed product removed successfully!"
 *       404:
 *         description: Diary entry or product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found in diary for this date!"
 *       500:
 *         description: Error removing consumed product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete product!"
 */



// Crearea unui endpoint pentru a șterge un produs consumat într-o anumită zi.
router.delete('/remove/:date/:productId', auth, async (req, res) => {
    try {
        const { date, productId } = req.params;
        const userId = req.user._id;

        console.log('Received date:', date);
        console.log('Received productId:', productId);

        const inputDate = new Date(date);
        const startDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate()));
        const endDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate() + 1, 23, 59, 59, 999));

        console.log('Searching between:', startDate.toISOString(), 'and', endDate.toISOString());

        // Find the diary entry for the user and date
        const diaryEntry = await Diary.findOne({
            userId,
            'entries.date': {
                $gte: startDate,
                $lte: endDate
            }
        }).populate({
            path: 'entries.productId', 
            select: 'title'
        });

        if (!diaryEntry) {
            console.log('No diary entry found for this userId and date');
            return res.status(404).json({ message: "Diary entry not found for this date!" });
        }

        // Find the entry to remove
        const entryIndex = diaryEntry.entries.findIndex(entry =>
            entry._id.toString() === productId.toString()
        );

        if (entryIndex === -1) {
            console.log('Product not found in diary entry');
            return res.status(404).json({ message: `Product not found in diary for this date!` });
        }

        diaryEntry.entries.splice(entryIndex, 1);
        await diaryEntry.save();

        return res.status(200).json({
            message: "Consumed product removed successfully!",
            diaryEntry
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ error: 'Failed to delete product!' });
    }
});

/**
 * @swagger
 * /api/diary/consumed/{date}:
 *   get:
 *     summary: Get all consumed products for a specific date
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: date
 *         in: path
 *         required: true
 *         description: Date for which to retrieve consumed products 
 *         schema:
 *           type: string
 *           example: "2024-09-12"
 *     responses:
 *       200:
 *         description: Successfully retrieved consumed products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: "2024-09-12"
 *                 consumedProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: object
 *                         $ref: '#/components/schemas/Product'
 *                       product_weight:
 *                         type: number
 *                         example: 50
 *                       product_Calories:
 *                         type: number
 *                         example: 171
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-09-12T00:00:00.000Z"
 *       404:
 *         description: No diary entry found for the specified date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No diary entry found for this date."
 *       500:
 *         description: Error fetching consumed products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching consumed products"
 */



// Crearea unui endpoint pentru a primi toate informațiile despre o anumită zi.
router.get('/consumed/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user._id;

        // Convertim data primită într-un obiect Date
         const inputDate = new Date(date);
         const startDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate()));
        const endDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate() + 1, 23, 59, 59, 999));

        console.log('Start Date:', startDate.toISOString());
        console.log('End Date:', endDate.toISOString());

        // toate intrarile din jurnal pentru utilizatorul curent si data selectata
        const diaryEntries = await Diary.findOne({
            userId,
            'entries.date': {
                $gte: startDate,
                $lte: endDate
            }
        }).populate({
            path: 'entries.productId', 
            select: 'title' 
        });

        if (!diaryEntries || diaryEntries.entries.length === 0) {
            return res.status(200).json({
                date,
                consumedProducts: []
            });
        }

        // Filtrm produsele consumate in ziua specificata
        const filteredEntries = diaryEntries.entries.filter(entry =>
            new Date(entry.date).toDateString() === new Date(date).toDateString()
        );

        return res.status(200).json({
            date,
            consumedProducts: filteredEntries
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
// Crearea unui endpoint pentru a șterge un produs consumat într-o anumită zi.
// router.delete('/remove/:productId', auth, async (req, res) => {
//     try {
//         const { productId } = req.params;
//         const userId = req.user._id;

//         const diaryEntry = await Diary.findOne({ userId });

//         if (!diaryEntry) {
//             return res.status(404).json({ message: "Diary not found!" });
//         }

//         const entryIndex = diaryEntry.entries.findIndex(entry =>
//             entry.productId.toString() === productId.toString() &&
//             new Date(entry.date).toDateString() === new Date().toDateString()
//         );

//         if (entryIndex === -1) {
//             const product = await Product.findById(productId);
//             const productTitle = product ? product.title : 'unknown product';
            
//             return res.status(404).json({ message: `Product ${productTitle} not found in diary!` });
//         }

//         diaryEntry.entries.splice(entryIndex, 1);
//         await diaryEntry.save();

//         return res.status(200).json({ message: "Consumed product removed successfully!" });

//     } catch (error) {
//         console.error("Error deleting product:", error);
//         return res.status(500).json({ error: 'Failed to delete product!' });
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
