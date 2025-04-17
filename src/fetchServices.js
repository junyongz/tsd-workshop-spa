import ServiceTransactions from "./ServiceTransactions";

export default async function fetchServices(apiUrl, services, setFilteredServices) {

    return fetch(`${apiUrl}/workshop-services`, {mode: 'cors'})
          .then(res => {
            return res.json() 
          })
          .then(response => {
            services.current = new ServiceTransactions(response)
            setFilteredServices(services.current.formattedTransactions)
          })
          .catch(error => {
            console.error('There was an error fetching the services:', error);
          });
}