class ServiceTransactions {
    constructor(transactions = []) {
        this.transactions = transactions
        this.refreshIndexes()
    }

    refreshIndexes = () => {
        this.transactionIndexs = this.transactions.reduce((acc, cv, ci) => {
            acc[cv.id] = ci
            return acc
        },{})
    }

    addNewTransaction(newService) {
        // special for workmanship task
        const doMergeTasks = (oldTasks=[], newTasks=[]) =>
            [...oldTasks.map(ot => ({
                ...ot,
                ...newTasks.find(nt => nt.id === ot.id)
            })), ...newTasks.filter(nt => oldTasks.findIndex(ot => ot.id === nt.id) === -1)]
        

        const existingIdx = this.transactionIndexs[newService.id]
        if (existingIdx === undefined) {
            newService.sparePartsCount = newService.sparePartUsages?.length
            newService.workmanshipTasksCount = newService.tasks?.length
            this.transactions.push(newService)
            this.transactions.sort((a, b) => 
                (b.completionDate === null) - (a.completionDate === null) || 
                    (a.completionDate === null ? b.startDate.localeCompare(a.startDate) : 
                    b.completionDate.localeCompare(a.completionDate) || b.startDate.localeCompare(a.startDate)))
            this.refreshIndexes()
        }
        else {
            const oldService = this.transactions[existingIdx]
            newService.sparePartUsages = [...oldService.sparePartUsages, ...newService.sparePartUsages]
            newService.tasks = doMergeTasks(oldService.tasks, newService.tasks)
            newService.sparePartsCount = newService.sparePartUsages?.length
            newService.workmanshipTasksCount = newService.tasks?.length
            this.transactions[existingIdx] = newService
        }
    }

    updateTransaction(updatedService) {
        this.transactions[this.transactionIndexs[updatedService.id]] = updatedService
    }

    updateForNote(updatedService) {
        const oldPrevService = this.transactions[this.transactionIndexs[updatedService.id]]
        this.transactions[this.transactionIndexs[updatedService.id]] = {...oldPrevService, notes: updatedService.notes}
    }

    removeService(deletingService) {
        const idx = this.transactionIndexs[deletingService.id]
        this.transactions.splice(idx, 1)
        delete this.transactionIndexs[idx]
    }

    removeTransaction(serviceId, sparePartUsageId) {
        const service = this.transactions[this.transactionIndexs[serviceId]]
        service.sparePartUsages.splice(service.sparePartUsages.findIndex(v => v.id === sparePartUsageId), 1)
    }

    removeTask(serviceId, taskId) {
        const service = this.transactions[this.transactionIndexs[serviceId]]
        service.tasks.splice(service.tasks.findIndex(v => v.id === taskId), 1)
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