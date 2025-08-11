/**
 * 
 * @param {import("../suppliers/SupplierOrders").SupplierOrder} order 
 * @param {import("../ServiceTransactions").SparePartUsage[]} sparePartUsages
 * @returns how much retain after the spare part usages
 */
export default function remainingQuantity(order, sparePartUsages) {
    return !sparePartUsages ? order?.quantity
        : order?.quantity - sparePartUsages.filter(spu => spu.orderId === order.id)
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