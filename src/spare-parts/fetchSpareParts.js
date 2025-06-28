export default async function fetchSpareParts (apiUrl, setSpareParts, setSearchOptions, setOrderSpareParts) {

    return fetch(`${apiUrl}/api/spare-parts`, {mode: 'cors'})
      .then(res => res.json())
      .then((response=[]) => {
          setSpareParts(response.filter(sp => sp.addAllowed).sort((sp1, sp2) => sp2.orderId - sp1.orderId))
          setOrderSpareParts(
            Object.values(response
              .filter(sp => sp.orderId != null)
              .reduce((acc, curr) => {
                const existing = acc[curr.partName]
                let toAdd = true
                if (existing && existing.invoiceDate > curr.invoiceDate) {
                  toAdd = false
                }
                if (toAdd) {
                  acc[curr.partName] = curr
                }
                return acc
              } , {}))
              .map(sp => {
                  return {orderId: sp.orderId, invoiceDate: sp.invoiceDate, unit: sp.unit, unitPrice: sp.unitPrice, supplierId: sp.supplierId, itemCode: sp.itemCode, partName: sp.partName}
              })
              .sort((sp1, sp2) => sp2.orderId - sp1.orderId))
      })
      .catch(error => {
        console.error('There was an error fetching the spare parts:', error);
      });

}