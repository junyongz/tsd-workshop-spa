import ServiceTransactions from "./ServiceTransactions";

export async function fetchFewPagesServices(apiUrl, services, setFilteredServices, searchedOptions) {

  return fetch(`${apiUrl}/workshop-services?pageNumber=0&pageSize=30`, {mode: 'cors'})
        .then(res => res.json())
        .then(response => {
          services.current = new ServiceTransactions(response)
          // clear all search before data
          searchedOptions.current.clear()
          setFilteredServices(services.current.transactions)
        })
        .catch(error => {
          console.error('There was an error fetching the services:', error);
        });
}

export default async function fetchServices(apiUrl, services, setFilteredServices, searchedOptions) {

    return fetch(`${apiUrl}/workshop-services`, {mode: 'cors'})
          .then(res => res.json())
          .then(response => {
            services.current = new ServiceTransactions(response)
            // clear all search before data
            searchedOptions.current.clear()
            setFilteredServices(services.current.transactions)
          })
          .catch(error => {
            console.error('There was an error fetching the services:', error);
          });
}