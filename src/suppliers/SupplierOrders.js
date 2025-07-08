class SupplierOrders {
    #ordersList
    #ordersMapping
    #ordersIndexes
    constructor(orders=[], dispatch) {
        this.#ordersList = orders
        this.#refreshIndexes()
        this.#refreshMapping()
        this.dispatch = dispatch
    }

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
        this.dispatch([...this.#ordersList].sort((a, b) => a.invoiceDate < b.invoiceDate))
    }

    byId(id=0) {
        return this.#ordersMapping[id]
    }

    forIndex(id=0) {
        return this.#ordersIndexes[id]
    }

    removeOrder(order) {
        const idx = this.forIndex(order.id)
        this.#ordersList.splice(idx, 1)
        delete this.#ordersIndexes[order.id]
        delete this.#ordersMapping[order.id]
        this.#doSetOrders()
    }

    replaceAll(orders=[]) {
        this.#ordersList = orders
        this.#refreshIndexes()
        this.#refreshMapping()
        this.#doSetOrders()
    }

    updateOrders(orders=[]) {
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

    #doRemoveSparePart(sparePartId=1000) {
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

    updateOrdersSparePartId(sparePartId=1000, orderIds=[]) {
        this.#doRemoveSparePart(sparePartId)

        orderIds.forEach(oid => {
            const idx = this.forIndex(oid)
            this.#ordersList[idx].sparePartId = sparePartId
        })

        this.#doSetOrders()
    }

    removeSparePart(sparePartId=1000) {
        this.#doRemoveSparePart(sparePartId)
        this.#doSetOrders()
    }

    list() {
        return this.#ordersList
    }
}

export default SupplierOrders