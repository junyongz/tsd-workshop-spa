export default async function fetchSpareParts (apiUrl, setSpareParts, setSearchOptions) {

    return fetch(`${apiUrl}/spare-parts`, {mode: 'cors'})
      .then(res => res.json())
      .then(response => {
          setSpareParts(response.filter(sp => sp.addAllowed).sort((sp1, sp2) => sp2.orderId - sp1.orderId))
          setSearchOptions(prevs => 
            [...prevs, ...response
              .filter(v => prevs.findIndex(pv => pv.name === v.partName) === -1)
              .map(sp => {return {name: sp.partName}})
            ]
          )
      })
      .catch(error => {
        console.error('There was an error fetching the spare parts:', error);
      });

}