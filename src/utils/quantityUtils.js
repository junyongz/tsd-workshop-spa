/**
 * 
 * @param {Object} order 
 * @param {number} order.id order id, to match with spare part usage's orderId
 * @param {number} order.quantity quantity, initial order quantity
 * @param {Object[]} sparePartUsages
 * @param {number} sparePartUsages[].orderId order's id used by the spare parts
 * @param {number} sparePartUsages[].quantity quantity used by the spare parts
 * @returns how much retain after the spare part usages
 */
export default function remainingQuantity(order, sparePartUsages) {
    return order?.quantity - sparePartUsages.filter(spu => spu.orderId === order.id)
                                    .reduce((oldSum, cv) => oldSum += cv.quantity, 0);
}

/**
 * 
 * @param {string} unit the unit of measure, eg litres
 * @returns whether allow decimal input given the UOM
 */
export const decimalPointUomAvailable = (unit) => {
    const availableUomsUpper = ['LITRE', 'LITRES', 'LTR', 'LTRS'];
    return availableUomsUpper.includes(unit?.toUpperCase())
}