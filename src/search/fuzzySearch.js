import ServiceTransactions from "../ServiceTransactions"
import SupplierOrders from "../suppliers/SupplierOrders"

export const doFilterServices = (options=[], transactions = {current: new ServiceTransactions()}, setSelectedSearchOptions) => {
    const apiUrl = process.env.REACT_APP_API_URL

    if (transactions.current) {
      const keywords = options.map(opt => `keyword=${opt.name}`).join('&')

      fetch(`${apiUrl}/api/workshop-services?${keywords}`)
        .then(resp => resp.json())
        .then(wss => {
          transactions.current.updateTransactions(wss)
        })
    }

    setSelectedSearchOptions(options)
}

// TODO how to get rid of this sparePartUsages
export function applyFilterOnOrders(selectedSearchOptions=[], selectedSearchDate, orders=[], sparePartUsages, selectedSupplier) {
  // either no selected search options, or part name, code, notes or usage vehicle no matched
  if (selectedSearchDate) {
    return orders.filter(o => o.invoiceDate === selectedSearchDate)
  }

  return orders.filter(o =>
        ((!selectedSearchOptions || selectedSearchOptions.length === 0) ||
          selectedSearchOptions.some(val => 
            o.partName.toUpperCase().includes(val.name.toUpperCase()) ||
            (o.itemCode && val.name.toUpperCase().includes(o.itemCode.toUpperCase())) || 
            o.notes?.toUpperCase().includes(val.name.toUpperCase()) ||
            sparePartUsages.find(spu => spu.orderId === o.id)?.vehicleNo?.includes(val.name)) 
        ) && (!selectedSupplier || o.supplierId === selectedSupplier.id))
}

export function applyFilterOnServices(selectedSearchOptions=[], selectedSearchDate, vehicles=[{vehicleNo:''}], services=[], supplierOrders=new SupplierOrders()) {
  if (selectedSearchDate) {
    return services.filter(ws => ws.startDate === selectedSearchDate)
  }

  if (!selectedSearchOptions || selectedSearchOptions.length === 0) {
    return services
  }

  const vehicleNosMatching = selectedSearchOptions.map(so => vehicles.findIndex(veh => veh.vehicleNo === so.name) >= 0)
  const allSearchOptionsAreVehicles = vehicleNosMatching.every(p => p)
  const atLeastOneSearchOptionIsVehicle = vehicleNosMatching.some(p => p)

  return services.filter(ws => {
    const vehicleMatched = selectedSearchOptions.some(val => ws.vehicleNo === val.name)

    let foundSpareParts = false
    for (const item of ws.migratedHandWrittenSpareParts || []) {
      if (selectedSearchOptions.some(val => item.partName?.toUpperCase().includes(val.name.toUpperCase())) ||
            selectedSearchOptions.some(val => item.itemDescription?.toUpperCase().includes(val.name.toUpperCase())) ) {
        foundSpareParts = true
        break
      }
    }

    for (const item of ws.sparePartUsages || []) {
      if (selectedSearchOptions.some(val => supplierOrders.byId(item.orderId)?.partName
          .toUpperCase().includes(val.name.toUpperCase()))
        || selectedSearchOptions.some(val => val.name.toUpperCase().includes(
            supplierOrders.byId(item.orderId)?.partName.toUpperCase()))) {
        foundSpareParts = true
        break
      }
    }

    return (vehicleMatched && selectedSearchOptions.length > 1 && (allSearchOptionsAreVehicles || foundSpareParts))
            || (vehicleMatched && selectedSearchOptions.length === 1)
            || ((!vehicleMatched && !atLeastOneSearchOptionIsVehicle) && selectedSearchOptions.length >= 1 && foundSpareParts)
  })
}