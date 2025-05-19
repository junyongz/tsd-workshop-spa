import ServiceTransactions from "./ServiceTransactions";

export default async function fetchServices(apiUrl, services, setFilteredServices) {

    return fetch(`${apiUrl}/workshop-services`, {mode: 'cors'})
          .then(res => res.json())
          .then(response => {
            services.current = new ServiceTransactions(response)
            setFilteredServices(services.current.transactions)
          })
          .catch(error => {
            console.error('There was an error fetching the services:', error);
          });
}