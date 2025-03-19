export default function fetchSpareParts (apiUrl, setSpareParts, setSearchOptions) {

    fetch(`${apiUrl}/spare-parts`, {mode: 'cors'})
    .then(res => {
      return res.json() 
    })
    .then(response => {
        setSpareParts(response.filter(sp => sp.addAllowed))
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