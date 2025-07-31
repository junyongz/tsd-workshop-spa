import ServiceTransactions from "./ServiceTransactions";

/**
 * 
 * @param {string} apiUrl 
 * @param {ServiceTransactions} transactions 
 * @param {React.RefObject<Set<string>>} searchedOptions 
 * @returns {Promise}
 */
export async function fetchFewPagesServices(apiUrl, transactions, searchedOptions) {

  return fetch(`${apiUrl}/api/workshop-services?pageNumber=0&pageSize=30`, {mode: 'cors'})
        .then(res => res.json())
        .then(response => {
          transactions.replaceTransactions(response)
          // clear all search before data
          searchedOptions.current.clear()
        })
        .catch(error => {
          console.error('There was an error fetching the services:', error);
        });
}

/**
 * 
 * @param {string} apiUrl 
 * @param {ServiceTransactions} transactions 
 * @param {React.RefObject<Set<string>>} searchedOptions 
 * @returns {Promise}
 */
export default async function fetchServices(apiUrl, transactions, searchedOptions) {

    return fetch(`${apiUrl}/api/workshop-services`, {mode: 'cors'})
          .then(res => res.json())
          .then(response => {
            transactions.replaceTransactions(response)
            // clear all search before data
            searchedOptions.current.clear()
          })
          .catch(error => {
            console.error('There was an error fetching the services:', error);
          });
}