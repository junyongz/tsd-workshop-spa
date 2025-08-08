/**
 * @param {React.SetStateAction<boolean>} setLoading 
 * @param {import("../ServiceTransactions").default} transactions
 * @param {Function} refreshSparePartUsages 
 * @param {Function} clearState to remove state checking from session storage, so wont refresh again
 * @param {import("../ServiceTransactions").WorkshopService} service 
 */
export default function saveService( 
    setLoading, transactions,
    refreshSparePartUsages,
    clearState, service
) {
    const apiUrl = process.env.REACT_APP_API_URL

    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/api/workshop-services`, {
        method: 'POST', 
        body: JSON.stringify(service), 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => {
        if (!res.ok) {
          throw Error("failed to save service: " + JSON.stringify(service))
        }
        return res.json()
      })
      .then(
        /** @param {import("../ServiceTransactions").WorkshopService service} */
      service => {
        transactions.addNewTransaction(service)
      })
      .then(() => refreshSparePartUsages())
      .then(() => clearState())
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
    })
    
  }