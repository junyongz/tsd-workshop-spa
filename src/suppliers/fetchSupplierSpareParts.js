import SupplierOrders from "./SupplierOrders";

/**
 * 
 * @param {string} apiUrl 
 * @param {SupplierOrders} supplierOrders 
 * @param {string} fetchMode either ACTIVE or ALL (ACTIVE only for those being used)
 * @returns 
 */
async function fetchSupplierSparePartsWithFetchMode(apiUrl, supplierOrders, fetchMode) {

    return fetch(`${apiUrl}/api/supplier-spare-parts?fetch=${fetchMode}`, {mode: 'cors'})
    .then(res => res.json())
    .then(ordersJson => {
       supplierOrders.replaceAll(ordersJson)
    })
    .catch(error => {
        console.error('There was an error fetching the supplier-spare-parts:', error);
    });

}

/**
 * 
 * @param {string} apiUrl 
 * @param {SupplierOrders} supplierOrders 
 * @returns 
 */
export async function fetchWithUsageSupplierSpareParts(apiUrl, supplierOrders) {
    return fetchSupplierSparePartsWithFetchMode(apiUrl, supplierOrders, 'ACTIVE')
}

/**
 * 
 * @param {string} apiUrl 
 * @param {SupplierOrders} supplierOrders 
 * @returns 
 */
export async function fetchSupplierSpareParts(apiUrl, supplierOrders) {
    return fetchSupplierSparePartsWithFetchMode(apiUrl, supplierOrders, 'ALL')
}