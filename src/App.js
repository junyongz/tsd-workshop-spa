import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ServiceListing from './ServiceListing';
import ServiceDetail from './ServiceDetail';
import { Col, Container, Form, Navbar, Row } from 'react-bootstrap';
import ServiceTransactions from './ServiceTransactions';
import { Typeahead } from 'react-bootstrap-typeahead';

/***
 * Date: {
 *  vehicle: [transactions]
 * }
 */

function App() {
  const apiUrl = process.env.REACT_APP_API_URL
  const services = useRef()
  const [filteredServices, setFilteredServices] = useState()
  
  const [searchOptions, setSearchOptions] = useState([])
  const [selectedSearchOptions, setSelectedSearchOptions] = useState([])

  const [vehicles, setVehicles] = useState([])
  const [spareParts, setSpareParts] = useState([])
  
  const filterTimeoutRef = useRef()

  useEffect(() => {
    fetch(`${apiUrl}/vehicles`, {mode: 'cors'})
    .then(res => {
      return res.json() 
    })
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
  }, []);


  const doFilterServices = (options=[]) => {
    if (services) {
      const searchedFilteredServices = []
      for (const v of services.current.entriedServices()) {
        const vehicleItemsForV0 = {}
        for (const [veh, items] of Object.entries(v[1])) {
          if (options.some(val => veh.includes(val.name))) {
            vehicleItemsForV0[veh] = items
          }

          for (const item of items) {
            if (options.some(val => item.itemDescription.toUpperCase().includes(val.name.toUpperCase()))) {
              vehicleItemsForV0[veh] = items
            }
          }
        }
        if (Object.values(vehicleItemsForV0).length > 0) {
          searchedFilteredServices.push([v[0], vehicleItemsForV0])
        }
      }

      searchedFilteredServices.sort((left, right) => left[0] < right[0])
      setFilteredServices(searchedFilteredServices)
    }
    setSelectedSearchOptions(options)
  }

  const filterServices = (options=[]) => {
    if (!options || options.length === 0) {
      clearTimeout(filterTimeoutRef.current)
      setFilteredServices(services.current.entriedServices())
      setSelectedSearchOptions([])
      return
    }

    clearTimeout(filterTimeoutRef.current)
    filterTimeoutRef.current = setTimeout(() => doFilterServices(options), 600)
  }

  useEffect(() => {
    // Fetch data from your API endpoint
    fetch(`${apiUrl}/transactions`, {mode: 'cors'})
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
  }, []);

  if (!filteredServices) {
    return (<div>Loading...</div>)
  }

  return (
    <div className="App">
        <Container className='my-3'>
          <Row>
            <Col sm="2">
              <h3>TSD Workshop</h3>
            </Col>
            <Col>
              <Form.Group>
              <Typeahead
                  id="search-multiple"
                  labelKey="name"
                  multiple
                  onChange={filterServices}
                  options={searchOptions}
                  placeholder="Choose by vehicle(s) and/or spart part(s)"
                  selected={selectedSearchOptions}
                />
                </Form.Group>
            </Col>
          </Row>
        </Container>
      <Router>
        <Routes>
          <Route exact path="/" element={
            <ServiceListing services={services}
              vehicles={vehicles}
              setVehicles={setVehicles}
              spareParts={spareParts}
              filteredServices={filteredServices}
              keywordSearch={() => {
                if (selectedSearchOptions && selectedSearchOptions.length == 0) {
                  setFilteredServices(services.current.entriedServices()) 
                }
                else {
                  doFilterServices(selectedSearchOptions)}
                }
              }
            />
          } />
          <Route path="/service/:id" element={<ServiceDetail />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;