
export default async function fetchSupplierSpareParts(apiUrl, orders, setFilteredOrders) {

    return fetch(`${apiUrl}/supplier-spare-parts`, {mode: 'cors'})
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