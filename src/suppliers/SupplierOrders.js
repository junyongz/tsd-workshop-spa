class SupplierOrders {
    #ordersList
    #ordersMapping
    #ordersIndexes

    /**
     * 
     * @param {Object[]} orders 
     * @param {React.ActionDispatch<Object[]} dispatch 
     */
    constructor(orders, dispatch) {
        this.#ordersList = orders
        this.#refreshIndexes()
        this.#refreshMapping()
        this.dispatch = dispatch
    }

    /**
     * 
     * @param {React.ActionDispatch<Object[]>} dispatch 
     * @returns 
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
     * @returns 
     */
    byId(id) {
        return this.#ordersMapping[id]
    }

    /**
     * 
     * @param {number} id 
     * @returns 
     */
    forIndex(id) {
        return this.#ordersIndexes[id]
    }

    /**
     * 
     * @param {Object} order 
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
     * @param {Object[]} orders
     */
    replaceAll(orders) {
        this.#ordersList = orders
        this.#refreshIndexes()
        this.#refreshMapping()
        this.#doSetOrders()
    }

    /**
     * 
     * @param {Object[]} orders 
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