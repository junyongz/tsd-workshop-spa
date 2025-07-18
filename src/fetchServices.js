import ServiceTransactions from "./ServiceTransactions";

export async function fetchFewPagesServices(apiUrl, transactions = new ServiceTransactions(), searchedOptions) {

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

export default async function fetchServices(apiUrl, transactions = new ServiceTransactions(), searchedOptions) {

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