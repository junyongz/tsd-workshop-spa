class ServiceTransactions {
    constructor(transactions = []) {
        this.transactions = transactions
        this.transactionIndexs = this.transactions.reduce((acc, cv, ci) => {
            acc[cv.id] = ci
            return acc
        },{})
    }

    addNewTransaction(newService) {
        const existingIdx = this.transactionIndexs[newService.id]
        if (existingIdx === undefined) {
            this.transactionIndexs[newService.id] = this.transactions.length
            this.transactions.push(newService)
            this.transactions.sort((left, right) => 
                new Date(left.startDate).getTime() < new Date(right.startDate).getTime())
        }
        else {
            const oldService = this.transactions[existingIdx]
            newService.sparePartUsages = [...oldService.sparePartUsages, ...newService.sparePartUsages]
            this.transactions[existingIdx] = newService
        }
    }

    updateTransaction(updatedService) {
        this.transactions[this.transactionIndexs[updatedService.id]] = updatedService       
    }

    removeTransaction(serviceId, sparePartUsageId) {
        const service = this.transactions[this.transactionIndexs[serviceId]]
        service.sparePartUsages.splice(service.sparePartUsages.findIndex(v => v.id === sparePartUsageId), 1)
    }

    services() {
        return this.transactions
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
        return Array.from(new Set(this.transactions.map(trx => 
            new Date(trx.creationDate).getFullYear()))).sort((a, b) => b - a)
    }
}

export default ServiceTransactions