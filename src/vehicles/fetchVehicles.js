export default async function fetchVehicles(apiUrl = '', setVehicles, setSearchOptions) {
    return fetch(`${apiUrl}/vehicles`, {mode: 'cors'})
      .then(res => res.json())
      .then(response => {
          setVehicles(response)
          setSearchOptions(prevs => 
            [...prevs, ...response
              .filter(v => prevs.findIndex(pv => pv.name === v.vehicleNo) === -1)
              .map(veh => {return {name: veh.vehicleNo}})
            ]
          )
      })
      .catch(error => {
        console.error('There was an error fetching the vehicles:', error);
      });
}