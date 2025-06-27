export default function saveService( 
    setLoading, transactions, 
    refreshSpareParts, refreshSparePartUsages,
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
          console.trace("Issue with POST workshop-services: " + JSON.stringify(res.body))
          throw Error("not good")
        }
        return res.json()
      })
      .then(service => {
        transactions.current.addNewTransaction(service)
      })
      .then(() => Promise.all([refreshSpareParts(), refreshSparePartUsages()]))
      .then(() => clearState())
      .finally(() => setLoading(false))
    })
    
  }