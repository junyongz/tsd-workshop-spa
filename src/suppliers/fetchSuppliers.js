export default async function fetchSuppliers(apiUrl, setSuppliers) {

    return fetch(`${apiUrl}/suppliers`, {mode: 'cors'})
        .then(res => res.json())
        .then(response => {
            setSuppliers(response)
        })
        .catch(error => {
            console.error('There was an error fetching the spare parts:', error);
        });
}