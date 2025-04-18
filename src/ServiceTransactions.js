class ServiceTransactions {
    constructor(transactions = []) {
        this.transactions = transactions
        this.formatTransactions()
    }


    /**
     * [
     *    {vehicle, migratedHandWrittenSpareParts: [], sparePartUsages: []}
     * ]
     */
    formatTransactions = () => {
        this.formattedTransactions = []
        this.transactions.forEach(v => {
            const idx = this.formattedTransactions.findIndex(t => t.startDate === v.startDate)
            const found = idx >= 0
            if (!found) {
                this.formattedTransactions.push({'startDate': v.startDate, 'services': [v]})
            }
            else {
                this.formattedTransactions[idx].services.push(v)
            }
        })
    }

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