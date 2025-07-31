/**
 * @typedef {Object} WorkshopService a entity represents a workshop service
 * @property {number} id primary key
 * @property {string} startDate start date of a service, in format of '2005-05-05'
 * @property {string} creationDate creation date of a service, in format of '2005-05-05'
 * @property {string} completionDate completion date of a service, in format of '2005-05-05'
 * @property {number} vehicleId vehicle id
 * @property {string} vehicleNo vehicle no
 */

class ServiceTransactions {
    /**
     * @type {WorkshopService[]}
     */
    #transactions
    /**
     * @type {Object<number, number>}
     */
    #transactionIndexes

    /**
     * 
     * @param {WorkshopService[]} transactions 
     * @param {React.ActionDispatch<WorkshopService[]>} dispatch 
     */
    constructor(transactions = [], dispatch) {
        this.#transactions = transactions
        this.#refreshIndexes()
        this.dispatch = dispatch
    }

    /**
     * 
     * @param {React.ActionDispatch<Object[]>} dispatch 
     */
    acceptDispatch(dispatch) {
        this.dispatch = dispatch
    }

    #refreshIndexes = () => {
        this.#transactionIndexes = this.#transactions.reduce((acc, cv, ci) => {
            acc[cv.id] = ci
            return acc
        },{})
    }

    #refreshServices() {
        this.dispatch([...this.#transactions].sort((a, b) => {
                if (!a.completionDate && !b.completionDate) {
                    return b.startDate.localeCompare(a.startDate);
                }
                if (!a.completionDate) return -1;
                if (!b.completionDate) return 1;
                return b.startDate.localeCompare(a.startDate);
            }))
    }

    /**
     * 
     * @param {WorkshopService} newService 
     */
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
            this.#refreshServices()
        }
    }

    /**
     * 
     * @param {WorkshopService} updatedService 
     */
    updateTransaction(updatedService) {
        this.#transactions[this.#transactionIndexes[updatedService.id]] = updatedService
        this.#refreshServices()
    }

    /**
     * 
     * @param {WorkshopService[]} updatedServices 
     */
    replaceTransactions(updatedServices) {
        this.#transactions = updatedServices
        this.#refreshIndexes()
        this.#refreshServices()
    }

    getTransaction(id) {
        return this.#transactions[this.#transactionIndexes[id]]
    }

    /**
     * 
     * @param {WorkshopService[]} updatedServices 
     */
    updateTransactions(updatedServices) {
        updatedServices.forEach(ws => this.#transactions[this.#transactionIndexes[ws.id]] = ws)
        this.#refreshServices()
    }

    /**
     * 
     * @param {WorkshopService} updatedService 
     */
    updateForNote(updatedService) {
        const oldPrevService = this.#transactions[this.#transactionIndexes[updatedService.id]]
        this.#transactions[this.#transactionIndexes[updatedService.id]] = {...oldPrevService, notes: updatedService.notes}
        this.#refreshServices()
    }

    /**
     * 
     * @param {WorkshopService} deletingService 
     */
    removeService(deletingService) {
        const idx = this.#transactionIndexes[deletingService?.id]
        if (idx >= 0) {
            this.#transactions.splice(idx, 1)
            delete this.#transactionIndexes[idx]
            this.#refreshServices()
        }
    }

    removeTransaction(serviceId, sparePartUsageId) {
        const service = this.#transactions[this.#transactionIndexes[serviceId]]
        const sparePartIdx = service.sparePartUsages.findIndex(v => v.id === sparePartUsageId)
        if (sparePartIdx >= 0) {
            service.sparePartUsages.splice(sparePartIdx, 1)
            this.#refreshServices()
        }
    }

    removeTask(serviceId, taskId) {
        const service = this.#transactions[this.#transactionIndexes[serviceId]]
        const taskIdx = service.tasks.findIndex(v => v.id === taskId)
        if (taskIdx >= 0) {
            service.tasks.splice(taskIdx, 1)
            this.#refreshServices()
        }
    }

    services() {
        return this.#transactions
    }

    // {vehicle: []}
    filterByYearMonthGroupByVehicle(year=2025, month=0) {
        return this.#transactions.filter(trx => {
            const creationDate = new Date(trx.startDate)
            if (creationDate.getFullYear() === year && creationDate.getMonth() === month) {
                return true
            }
            return false
        }).reduce((pv, cv) => {
            const trsx = pv[cv.vehicleNo] || []
            trsx.push(cv)
            pv[cv.vehicleNo] = trsx
            return pv
        }, {})
    }

    availableYears() {
        return Array.from(new Set(this.#transactions.map(trx => 
            new Date(trx.creationDate).getFullYear()))).sort((a, b) => b - a)
    }
}

export default ServiceTransactions