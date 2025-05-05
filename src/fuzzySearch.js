export const doFilterServices = (options=[], services, setFilteredServices, sparePartUsages, orders, setFilteredOrders, setSelectedSearchOptions) => {
    if (services.current) {
      const searchedFilteredServices = []
      for (const v of services.current.transactions) {
        let foundVehicle = false
        if (options.some(val => v.vehicleNo.includes(val.name))) {
          foundVehicle = true
        }

        let foundSpareParts = false
        if (!foundVehicle) {
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
        }

        if (foundVehicle || foundSpareParts) {
          searchedFilteredServices.push(v)
        }
      }

      searchedFilteredServices.sort((left, right) => left.startDate < right.startDate)
      setFilteredServices(searchedFilteredServices)
    }

    if (orders.current) {
      const searchedFilteredOrders = []
      for (const order of orders.current.listing) {
        if (options.some(val => 
            order.partName.toUpperCase().includes(val.name.toUpperCase()) || 
            order.notes?.toUpperCase().includes(val.name.toUpperCase()) ||
            sparePartUsages.find(spu => spu.orderId === order.id)?.vehicleNo === val.name)) {
          searchedFilteredOrders.push(order)
        }
      }
      setFilteredOrders(searchedFilteredOrders)
    }

    setSelectedSearchOptions(options)
  }