/**
 * @typedef {Object} Company
 * @property {number} id
 * @property {string} companyName
 * @property {boolean} internal whether the company is internal one, meaning own company
 */


/**
 * 
 * @param {string} apiUrl 
 * @param {React.SetStateAction<Company[]>} setCompanies 
 * @returns
 */
export default async function fetchCompanies(apiUrl, setCompanies) {
    return fetch(`${apiUrl}/api/companies`, {mode: 'cors'})
      .then(res => res.json())
      .then(response => {
        setCompanies(response)
      })
      .catch(error => {
        console.error('There was an error fetching the companies:', error);
      });
}