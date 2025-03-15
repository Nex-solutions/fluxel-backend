const express = require('express');
const router = express.Router();
const { tokenRequired } = require('../middleware/auth');
const {
    createAdvertisement,
    getAdvertisements,
    getMerchantAdvertisements,
    updateAdvertisement,
    deleteAdvertisement
} = require('../controller/advertisement');

/**
 * @swagger
 * /api/advertisement:
 *   post:
 *     summary: Create a new advertisement
 *     tags: [Advertisement]
 *     security:
 *       - fluxelAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               coinId:
 *                 type: string
 *               price:
 *                 type: number
 *               minAmount:
 *                 type: number
 *               maxAmount:
 *                 type: number
 *               terms:
 *                 type: string
 *               instantTrade:
 *                 type: boolean
 *               availableAmount:
 *                 type: number\
 *               responseTime:
 *                 type: number
 *     responses:
 *       201:
 *         description: Advertisement created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', tokenRequired, createAdvertisement);

/**
 * @swagger
 * /api/advertisement:
 *   get:
 *     summary: Get all advertisements
 *     tags: [Advertisement]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: coinId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all advertisements
 *       500:
 *         description: Server error
 */
router.get('/', getAdvertisements);

/**
 * @swagger
 * /api/advertisement/merchant:
 *   get:
 *     summary: Get merchant's advertisements
 *     tags: [Advertisement]
 *     security:
 *       - fluxelAccessToken: []
 *     responses:
 *       200:
 *         description: List of merchant's advertisements
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/merchant', tokenRequired, getMerchantAdvertisements);

/**
 * @swagger
 * /api/advertisement/{id}:
 *   put:
 *     summary: Update an advertisement
 *     tags: [Advertisement]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *               minAmount:
 *                 type: number
 *               maxAmount:
 *                 type: number
 *               terms:
 *                 type: string
 *               instantTrade:
 *                 type: boolean
 *               availableAmount:
 *                 type: number
 *               responseTime:
 *                 type: number
 *     responses:
 *       200:
 *         description: Advertisement updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Advertisement not found
 *       500:
 *         description: Server error
 */
router.put('/:id', tokenRequired, updateAdvertisement);

/**
 * @swagger
 * /api/advertisement/{id}:
 *   delete:
 *     summary: Delete an advertisement
 *     tags: [Advertisement]
 *     security:
 *       - fluxelAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advertisement deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Advertisement not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', tokenRequired, deleteAdvertisement);

module.exports = router;