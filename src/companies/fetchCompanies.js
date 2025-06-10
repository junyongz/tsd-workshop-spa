export default async function fetchCompanies(apiUrl = '', setCompanies) {
    return fetch(`${apiUrl}/api/companies`, {mode: 'cors'})
      .then(res => res.json())
      .then(response => {
        setCompanies(response)
      })
      .catch(error => {
        console.error('There was an error fetching the companies:', error);
      });
}