import ServiceTransactions from "./ServiceTransactions";

export default async function fetchServices(apiUrl, services, setFilteredServices) {

    return fetch(`${apiUrl}/transactions`, {mode: 'cors'})
          .then(res => {
            return res.json() 
          })
          .then(response => {
            services.current = new ServiceTransactions(response)
            setFilteredServices(services.current.entriedServices())
          })
          .catch(error => {
            console.error('There was an error fetching the services:', error);
          });
}