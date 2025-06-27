import SupplierOrders from "./SupplierOrders";

async function fetchSupplierSparePartsWithFetchMode(apiUrl, supplierOrders={current: new SupplierOrders()}, fetchMode) {

    return fetch(`${apiUrl}/api/supplier-spare-parts?fetch=${fetchMode}`, {mode: 'cors'})
    .then(res => res.json())
    .then(ordersJson => {
       supplierOrders.current.replaceAll(ordersJson)
    })
    .catch(error => {
        console.error('There was an error fetching the supplier-spare-parts:', error);
    });

}

export async function fetchWithUsageSupplierSpareParts(apiUrl, supplierOrders={current: new SupplierOrders()}) {

    return fetchSupplierSparePartsWithFetchMode(apiUrl, supplierOrders, 'ACTIVE')

}

export async function fetchSupplierSpareParts(apiUrl, supplierOrders={current: new SupplierOrders()}) {

    return fetchSupplierSparePartsWithFetchMode(apiUrl, supplierOrders, 'ALL')

}