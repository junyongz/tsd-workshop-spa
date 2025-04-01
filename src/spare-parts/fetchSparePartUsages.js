export default async function fetchSparePartUsages(apiUrl, setSparePartUsages, showToastMessage) {

    return fetch(`${apiUrl}/spare-part-utilizations`, {mode: 'cors'})
        .then(res => res.json())
        .then(response => {
            setSparePartUsages(response)
        })
        .catch(error => {
            if (showToastMessage) {
                showToastMessage('There was an error fetching the spare parts:' + error)
            }
            console.error('There was an error fetching the spare parts:', error);
        });

}