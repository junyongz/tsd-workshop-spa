export default function autoRefreshWorker(setLoading, refresherByTableName) {
    // stats-dbtables	[{"tableName":"mig_supplier_spare_parts","lastTransactionId":1781},{"tableName":"spare_part_usages","lastTransactionId":1781},{"tableName":"mig_data","lastTransactionId":1748}]

    const apiUrl = process.env.REACT_APP_API_URL

    const refreshBasedOnStats = (stats = [], response = []) => {
        const promises = []
        stats.forEach(v => { 
            const currVal = response.find(r => v.tableName === r.tableName).lastTransactionId
            if (currVal !== v.lastTransactionId) {
                promises.push(refresherByTableName[v.tableName])
            }
        })
    
        console.log('how many promises will be promised?', promises)
        if (promises.length > 0) {
            setLoading(true)
            requestAnimationFrame(() => {
                Promise.allSettled(promises.map(p => p())).then(() => setLoading(false))
            })
        }
    }

    return fetch(`${apiUrl}/stats/dbtables`, {mode: 'cors'})
        .then(res => res.json())
        .then(response => {
            // get and check
            const statsStr = sessionStorage.getItem('stats-dbtables')
            if (statsStr) {
                const stats = JSON.parse(statsStr);
                refreshBasedOnStats(stats, response)
            }
            sessionStorage.setItem('stats-dbtables', JSON.stringify(response))
        })
        .catch(error => {
            console.error('There was an error fetching the db stats:', error);
        });

}

export const clearState = () => {
    sessionStorage.removeItem('stats-dbtables')
}