/**
 * @typedef {Object} Supplier
 * @property {number} id
 * @property {string} supplierName
 */

/**
 * @typedef {Object} SupplierOrder
 * @property {number} id primary key
 * @property {string} invoiceDate invoice date in format of '2005-05-05'
 * @property {string} deliveryOrderNo
 * @property {string} itemCode
 * @property {string} partName
 * @property {number} quantity quantity for the order
 * @property {string} unit unit of measurement, eg, pc, litre, set,
 * @property {number} unitPrice unit price for the order
 * @property {string} notes any handwritten notes
 * @property {string} sheetName excel sheet name, for migrated data only
 * @property {number} sparePartId link to part id
 * @property {number} supplierId link to {@link Supplier#id}
 * @property {number} supplierName on-the-fly calculated against the suppliers
 * @property {string} status either ACTIVE or DEPLETED
 * @property {number} remaining on-the-fly calculated against spare part usages
 */

class SupplierOrders {
    /**
     * @type {SupplierOrder[]}
     */
    #ordersList
    /**
     * @type {Object<number,SupplierOrder>} key is the {@link SupplierOrder#id} value is the {@link SupplierOrder}
     */
    #ordersMapping
    /**
     * @type {Object<number,number>} key is the {@link SupplierOrder#id} value is the index in list
     */
    #ordersIndexes

    /**
     * 
     * @param {SupplierOrder[]} orders 
     * @param {React.ActionDispatch<SupplierOrder[]>} dispatch 
     */
    constructor(orders, dispatch) {
        this.#ordersList = orders
        this.#refreshIndexes()
        this.#refreshMapping()
        this.dispatch = dispatch
    }

    /**
     * 
     * @param {React.ActionDispatch<SupplierOrder[]>} dispatch 
     */
    acceptDispatch(dispatch) {
        this.dispatch = dispatch
    }

    #refreshIndexes() {
        this.#ordersIndexes = this.#ordersList.reduce((acc, cv, ci) => {
            acc[cv.id] = ci
            return acc
        },{})
    }

    #refreshMapping() {
        this.#ordersMapping = this.#ordersList.reduce((acc, cv) => {
            acc[cv.id] = cv
            return acc
        },{})
    }

    #doSetOrders() {
        this.dispatch([...this.#ordersList].sort(
            (a, b) => a.invoiceDate === b.invoiceDate ? b.id > a.id : a.invoiceDate < b.invoiceDate)
        )
    }

    /**
     * 
     * @param {number} id 
     * @returns {SupplierOrder}
     */
    byId(id) {
        return this.#ordersMapping[id]
    }

    /**
     * 
     * @param {number} id 
     * @returns {number} index for the order id
     */
    forIndex(id) {
        return this.#ordersIndexes[id]
    }

    /**
     * 
     * @param {SupplierOrder} order 
     * @param {number} order.id
     */
    removeOrder(order) {
        const idx = this.forIndex(order.id)
        this.#ordersList.splice(idx, 1)
        delete this.#ordersIndexes[order.id]
        delete this.#ordersMapping[order.id]
        this.#doSetOrders()
    }

    /**
     * 
     * @param {SupplierOrder[]} orders
     */
    replaceAll(orders) {
        this.#ordersList = orders
        this.#refreshIndexes()
        this.#refreshMapping()
        this.#doSetOrders()
    }

    /**
     * 
     * @param {SupplierOrder[]} orders 
     * @param {number} orders[].id
     */
    updateOrders(orders) {
        orders.forEach(o => {
            const idx = this.forIndex(o.id)
            if (idx >= 0) {
                this.#ordersList[idx] = o
            }
            else {
                this.#ordersList.push(o)
            }
            this.#ordersMapping[o.id] = o
        })
        this.#refreshIndexes()
        this.#doSetOrders()
    }

    /**
     * 
     * @param {number} sparePartId 
     */
    #doRemoveSparePart(sparePartId) {
        this.#ordersList.filter(o => o.sparePartId === sparePartId)
            .map(o => {
                // null and undefined can be very different
                o.sparePartId = null
                return o
            })
            .forEach(o => {
                const idx = this.forIndex(o.id)
                this.#ordersList[idx] = o
            })
    }

    /**
     * 
     * @param {number} sparePartId 
     * @param {number[]} orderIds 
     */
    updateOrdersSparePartId(sparePartId, orderIds) {
        this.#doRemoveSparePart(sparePartId)

        orderIds?.forEach(oid => {
            const idx = this.forIndex(oid)
            this.#ordersList[idx].sparePartId = sparePartId
        })

        this.#doSetOrders()
    }

    /**
     * 
     * @param {number} sparePartId 
     */
    removeSparePart(sparePartId) {
        this.#doRemoveSparePart(sparePartId)
        this.#doSetOrders()
    }

    list() {
        return this.#ordersList
    }
}

export default SupplierOrders