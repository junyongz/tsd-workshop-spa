export default function remainingQuantity(order={id:0,quantity:0}, sparePartUsages=[{orderId:0,quantity:0}]) {
    return order?.quantity - sparePartUsages.filter(spu => spu.orderId === order.id)
                                    .reduce((oldSum, cv) => oldSum += cv.quantity, 0);
}