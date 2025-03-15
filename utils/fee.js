const { FeeCharged } = require('../model/feeCharged');

/**
 * Charges a fee and records it in fee history
 * @param {Object} params Fee charge parameters
 * @param {string} params.userId User ID to charge
 * @param {number} params.coinId Coin ID for the transaction
 * @param {number} params.amount Amount being traded
 * @param {string} params.transactionType Type of transaction ('crypto' or 'fiat')
 * @param {string} params.action Action being performed ('deposit' or 'withdrawal')
 * @param {number} params.feePercentage Fee percentage to charge (e.g. 0.01 for 1%)
 * @returns {Promise<Object>} Created fee charge record
 */
const chargeFee = async ({ userId, coinId, amount, transactionType, action, feePercentage }) => {
    try {
        // Calculate fee amount
        const feeAmount = amount * feePercentage;
        // Create fee charge record
        const feeCharge = await FeeCharged.create({
            user: userId,
            coinId,
            amountTraded: amount,
            transactionType,
            action,
            fee: feeAmount,
        });

        return feeCharge;
    } catch (error) {
        throw new Error(`Failed to charge fee: ${error.message}`);
    }
};

/**
 * Refunds a previously charged fee
 * @param {Object} params Fee refund parameters
 * @param {string} params.feeChargeId ID of the fee charge to refund
 * @returns {Promise<Object>} Updated fee charge record
 */
const refundFee = async ({ feeChargeId }) => {
    try {
        // Find the fee charge record
        const feeCharge = await FeeCharged.findById(feeChargeId);
        if (!feeCharge) {
            throw new Error('Fee charge record not found');
        }

        // Create refund record with negative fee amount
        const refundCharge = await FeeCharged.create({
            user: feeCharge.user,
            coinId: feeCharge.coinId,
            amountTraded: feeCharge.amountTraded,
            transactionType: feeCharge.transactionType,
            action: `${feeCharge.action}_refund`,
            fee: -feeCharge.fee, // Negative amount to indicate refund
        });

        return refundCharge;
    } catch (error) {
        throw new Error(`Failed to refund fee: ${error.message}`);
    }
};

module.exports = {
    chargeFee,
    refundFee
};
