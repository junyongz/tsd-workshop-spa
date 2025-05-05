export default async function fetchVehicles(apiUrl = '', setVehicles, setSearchOptions) {
    return fetch(`${apiUrl}/vehicles`, {mode: 'cors'})
      .then(res => res.json())
      .then(response => {
          setVehicles(response)
          setSearchOptions(prevs => 
            Array.from(new Set([...prevs.map(pv => pv.name), ...response.map(rv => rv.vehicleNo)]))
            .map(vv => {return {name: vv}})
          )
      })
      .catch(error => {
        console.error('There was an error fetching the vehicles:', error);
      });
}