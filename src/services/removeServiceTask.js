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
      .then(res => res.json())
      .then(deleteId => {
        if (deleteId !== taskId) {
          throw Error("seems nothing deleted")
        }
        transactions.current.removeTask(serviceId, taskId)
      })
      .then(() => clearState())
      .finally(() => setLoading(false))
    })
}
