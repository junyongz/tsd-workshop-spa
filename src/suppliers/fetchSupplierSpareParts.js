async function fetchSupplierSparePartsWithFetchMode(apiUrl, orders, setFilteredOrders, fetchMode) {

    return fetch(`${apiUrl}/api/supplier-spare-parts?fetch=${fetchMode}`, {mode: 'cors'})
    .then(res => res.json())
    .then(response => {
        orders.current = { listing: response, 
                            mapping: response.reduce((acc, item) => {
                                acc[item.id] = item;
                                return acc;
                            }, {}) 
        }
        setFilteredOrders(response)
    })
    .catch(error => {
        console.error('There was an error fetching the supplier-spare-parts:', error);
    });

}

export async function fetchWithUsageSupplierSpareParts(apiUrl, orders, setFilteredOrders) {

    return fetchSupplierSparePartsWithFetchMode(apiUrl, orders, setFilteredOrders, 'ACTIVE')

}

export async function fetchSupplierSpareParts(apiUrl, orders, setFilteredOrders) {

    return fetchSupplierSparePartsWithFetchMode(apiUrl, orders, setFilteredOrders, 'ALL')

}