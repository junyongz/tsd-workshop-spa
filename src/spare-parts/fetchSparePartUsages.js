export default async function fetchSparePartUsages(apiUrl, setSparePartUsages) {

    return fetch(`${apiUrl}/spare-part-utilizations`, {mode: 'cors'})
        .then(res => res.json())
        .then(response => {
            setSparePartUsages(response)
        })
        .catch(error => {
        console.error('There was an error fetching the spare parts:', error);
        });

}