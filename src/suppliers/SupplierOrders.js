class SupplierOrders {
    #ordersList
    #ordersMapping
    #ordersIndexes
    #setOrders
    constructor(orders=[], setOrders) {
        this.#ordersList = orders
        this.#refreshIndexes()
        this.#refreshMapping()
        this.#setOrders = setOrders
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
        this.#setOrders([...this.#ordersList].sort((a, b) => a.invoiceDate < b.invoiceDate))
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

    list() {
        return this.#ordersList
    }
}

export default SupplierOrders