class ServiceTransactions {
    #setServices
    #transactions
    #transactionIndexes
    constructor(transactions = [], setServices) {
        this.#transactions = transactions
        this.#setServices = setServices
        this.#refreshIndexes()
    }

    #refreshIndexes = () => {
        this.#transactionIndexes = this.#transactions.reduce((acc, cv, ci) => {
            acc[cv.id] = ci
            return acc
        },{})
    }

    #refreshServices() {
        this.#setServices([...this.#transactions].sort((a, b) => {
                if (!a.completionDate && !b.completionDate) {
                    return b.startDate.localeCompare(a.startDate);
                }
                if (!a.completionDate) return -1;
                if (!b.completionDate) return 1;
                return b.startDate.localeCompare(a.startDate);
            }))
    }

    refresh() {
        this.#refreshServices()
    }

    addNewTransaction(newService) {
        const doMergeById = (prev=[], current=[]) =>
            [...prev.map(ot => ({
                ...ot,
                ...current.find(nt => nt.id === ot.id)
            })), ...current.filter(nt => prev.findIndex(ot => ot.id === nt.id) === -1)] 

        const existingIdx = this.#transactionIndexes[newService.id]
        if (existingIdx === undefined) {
            newService.sparePartsCount = newService.sparePartUsages?.length
            newService.workmanshipTasksCount = newService.tasks?.length
            this.#transactions.push(newService)
            this.#refreshIndexes()
            this.#refreshServices()
        }
        else {
            const oldService = this.#transactions[existingIdx]
            newService.sparePartUsages = doMergeById(oldService.sparePartUsages, newService.sparePartUsages)
            newService.tasks = doMergeById(oldService.tasks, newService.tasks)
            newService.sparePartsCount = newService.sparePartUsages?.length
            newService.workmanshipTasksCount = newService.tasks?.length
            this.#transactions[existingIdx] = newService
        }
        this.#refreshServices()
    }

    updateTransaction(updatedService) {
        this.#transactions[this.#transactionIndexes[updatedService.id]] = updatedService
        this.#refreshServices()
    }

    replaceTransactions(updatedServices) {
        this.#transactions = updatedServices
        this.#refreshIndexes()
        this.#refreshServices()
    }

    updateTransactions(updatedServices) {
        updatedServices.forEach(ws => this.#transactions[this.#transactionIndexes[ws.id]] = ws)
        this.#refreshServices()
    }

    updateForNote(updatedService) {
        const oldPrevService = this.#transactions[this.#transactionIndexes[updatedService.id]]
        this.#transactions[this.#transactionIndexes[updatedService.id]] = {...oldPrevService, notes: updatedService.notes}
        this.#refreshServices()
    }

    removeService(deletingService) {
        const idx = this.#transactionIndexes[deletingService.id]
        this.#transactions.splice(idx, 1)
        delete this.#transactionIndexes[idx]
        this.#refreshServices()
    }

    removeTransaction(serviceId, sparePartUsageId) {
        const service = this.#transactions[this.#transactionIndexes[serviceId]]
        service.sparePartUsages.splice(service.sparePartUsages.findIndex(v => v.id === sparePartUsageId), 1)
        this.#refreshServices()
    }

    removeTask(serviceId, taskId) {
        const service = this.#transactions[this.#transactionIndexes[serviceId]]
        service.tasks.splice(service.tasks.findIndex(v => v.id === taskId), 1)
        this.#refreshServices()
    }

    services() {
        return this.#transactions
    }

    // {vehicle: []}
    filterByYearMonthGroupByVehicle(year=2025, month=0) {
        const matchedYearMonthTrxs = this.#transactions.filter(trx => {
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
        return Array.from(new Set(this.#transactions.map(trx => 
            new Date(trx.creationDate).getFullYear()))).sort((a, b) => b - a)
    }
}

export default ServiceTransactions