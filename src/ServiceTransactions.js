class ServiceTransactions {
    constructor(transactions = []) {
        this.transactions = transactions
        this.formatTransactions()
    }

    formatTransactions = () => {
        this.formattedTransactions = {}
        for (const trx of this.transactions) {
            const trxsByVehicle = this.formattedTransactions[trx.creationDate] || {}
            const trxs = trxsByVehicle[trx.vehicleNo] || []
            trxs.push(trx)
            trxsByVehicle[trx.vehicleNo] = trxs
            this.formattedTransactions[trx.creationDate] = trxsByVehicle
        }
    }

    // TODO: to write api to push to backend too
    addNewTransaction(newTrx = []) {
        this.transactions.push(...newTrx)
        this.transactions.sort((left, right) => 
            new Date(left.creationDate).getTime() < new Date(right.creationDate).getTime())
        this.formatTransactions()
    }

    updateTransaction(newTrx = []) {
        newTrx.forEach(tt => 
            this.transactions[this.transactions.findIndex(t => t.index === tt.index)] = tt
        )
        this.formatTransactions()        
    }

    removeTransaction(index=-1) {
        this.transactions.splice(this.transactions.findIndex(v => v.index === index), 1)
        this.formatTransactions()
    }

    services() {
        return this.formattedTransactions
    }

    entriedServices() {
        return Object.entries(this.formattedTransactions)
    }

    // {vehicle: []}
    filterByYearMonthGroupByVehicle(year=2025, month=0) {
        const matchedYearMonthTrxs = this.transactions.filter(trx => {
            const creationDate = new Date(trx.creationDate)
            if (creationDate.getFullYear() === year && creationDate.getMonth() === month) {
                return true
            }
            return false
        })

        const formattedTrxs = {}
        matchedYearMonthTrxs.forEach(trx => {
            const vehTrxs = formattedTrxs[trx.vehicleNo] || []
            vehTrxs.push(trx)
            formattedTrxs[trx.vehicleNo] = vehTrxs
        })
        return formattedTrxs
    }

    availableYears() {
        return Array.from(new Set(this.transactions.map(trx => new Date(trx.creationDate).getFullYear()))).sort((a, b) => b - a)
    }
}

export default ServiceTransactions