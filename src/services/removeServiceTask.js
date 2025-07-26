export default function removeServiceTask (
    setLoading, transactions, clearState,
    serviceId, taskId
) {
    const apiUrl = process.env.REACT_APP_API_URL

    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/api/workshop-services/${serviceId}/tasks/${taskId}`, {
        method: 'DELETE', 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.text()) // https://developer.mozilla.org/en-US/docs/Web/API/Response/text always return as string
      .then(deleteId => {
        if (parseInt(deleteId) !== taskId) {
          throw Error("seems nothing deleted")
        }
        transactions.removeTask(serviceId, taskId)
      })
      .then(() => clearState())
      .finally(() => setLoading(false))
    })
}
