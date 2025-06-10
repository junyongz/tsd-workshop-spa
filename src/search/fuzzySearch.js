export const doInAppFilterServices = (options=[], services, orders, setFilteredServices) => {
    const searchedFilteredServices = []

    const vehicleMatchedTrxs = services.current.transactions.filter(trx => options.some(val => trx.vehicleNo.includes(val.name)))

    for (const v of (vehicleMatchedTrxs.length > 0 ? vehicleMatchedTrxs : services.current.transactions)) {
      let foundSpareParts = false
      for (const item of v.migratedHandWrittenSpareParts || []) {
        if (options.some(val => item.partName?.toUpperCase().includes(val.name.toUpperCase())) ||
        options.some(val => item.itemDescription?.toUpperCase().includes(val.name.toUpperCase())) ) {
          foundSpareParts = true
          break
        }
      }

      for (const item of v.sparePartUsages || []) {
        if (options.some(val => orders.current.mapping[item.orderId]?.partName
            .toUpperCase().includes(val.name.toUpperCase()))
          || options.some(val => val.name.toUpperCase().includes(
              orders.current.mapping[item.orderId]?.partName.toUpperCase()))) {
          foundSpareParts = true
          break
        }
      }

      if (foundSpareParts) {
        searchedFilteredServices.push(v)
      }
    }

    if (searchedFilteredServices.length === 0) {
      searchedFilteredServices.push(...vehicleMatchedTrxs)
    }

    searchedFilteredServices.sort((left, right) => left.startDate < right.startDate)
    setFilteredServices(searchedFilteredServices)
}

export const doInAppFilterOrders = (options, orders, setFilteredOrders, sparePartUsages) => {
    const searchedFilteredOrders = []
    for (const order of orders.current.listing) {
      if (options.some(val => 
          order.partName.toUpperCase().includes(val.name.toUpperCase()) ||
          (order.itemCode && val.name.toUpperCase().includes(order.itemCode.toUpperCase())) || 
          order.notes?.toUpperCase().includes(val.name.toUpperCase()) ||
          sparePartUsages.find(spu => spu.orderId === order.id)?.vehicleNo === val.name)) {
        searchedFilteredOrders.push(order)
      }
    }
    setFilteredOrders(searchedFilteredOrders)
}

export const doFilterServices = (options=[], services, setFilteredServices, sparePartUsages, orders, setFilteredOrders, setSelectedSearchOptions) => {
    const apiUrl = process.env.REACT_APP_API_URL

    if (services.current) {
      const keywords = options.map(opt => `keyword=${opt.name}`).join('&')

      fetch(`${apiUrl}/api/workshop-services?${keywords}`)
        .then(resp => resp.json())
        .then(wss => {
          wss.forEach(ws => services.current.updateTransaction(ws))
          setFilteredServices([...wss].sort((left, right) => left.startDate < right.startDate))
        })
    }

    if (orders.current) {
        doInAppFilterOrders(options, orders, setFilteredOrders, sparePartUsages)
    }

    setSelectedSearchOptions(options)
}