import React, { useEffect, useState, useRef } from 'react';
import { Route, Routes, NavLink, useLocation } from 'react-router-dom';
import ServiceListing from './ServiceListing';
import { Badge, Col, Container, Form, Row } from 'react-bootstrap';
import ServiceTransactions from './ServiceTransactions';
import { Typeahead } from 'react-bootstrap-typeahead';
import SuppliersSpareParts from './suppliers/SuppliersSpareParts';
import fetchSpareParts from './spare-parts/fetchSpareParts';

import './App.css'

/***
 * Date: {
 *  vehicle: [transactions]
 * }
 */

function App() {
  const location = useLocation()
  const apiUrl = process.env.REACT_APP_API_URL

  // the services and orders from supplier
  const services = useRef()
  const [filteredServices, setFilteredServices] = useState()

  const orders = useRef()
  const [filteredOrders, setFilteredOrders] = useState()
  
  // search box
  const [searchOptions, setSearchOptions] = useState([])
  const [selectedSearchOptions, setSelectedSearchOptions] = useState([])

  // domain data
  const [suppliers, setSuppliers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [spareParts, setSpareParts] = useState([])
  
  const filterTimeoutRef = useRef()

  const doFilterServices = (options=[]) => {
    if (services.current) {
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

    if (orders.current) {
      const searchedFilteredOrders = []
      for (const order of orders.current) {
        if (options.some(val => 
            order.partName.toUpperCase().includes(val.name.toUpperCase()) || 
            order.notes?.toUpperCase().includes(val.name.toUpperCase()))) {
          searchedFilteredOrders.push(order)
        }
      }
      setFilteredOrders(searchedFilteredOrders)
    }

    setSelectedSearchOptions(options)
  }

  const filterServices = (options=[]) => {
    if (!options || options.length === 0) {
      clearTimeout(filterTimeoutRef.current)
      setFilteredServices(services.current.entriedServices())
      setFilteredOrders(orders.current)
      setSelectedSearchOptions([])
      return
    }

    clearTimeout(filterTimeoutRef.current)
    filterTimeoutRef.current = setTimeout(() => doFilterServices(options), 600)
  }

  useEffect(() => {
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

    fetch(`${apiUrl}/supplier-spare-parts`, {mode: 'cors'})
      .then(res => {
        return res.json() 
      })
      .then(response => {
        orders.current = response
        setFilteredOrders(response)
      })
      .catch(error => {
        console.error('There was an error fetching the upplier-spare-parts:', error);
      });

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

    fetchSpareParts(apiUrl, setSpareParts, setSearchOptions)

    fetch(`${apiUrl}/suppliers`, {mode: 'cors'})
      .then(res => {
        return res.json() 
      })
      .then(response => {
          setSuppliers(response)
      })
      .catch(error => {
        console.error('There was an error fetching the spare parts:', error);
      });
  }, []);

  if (!filteredServices && !filteredOrders) {
    return (<div>Loading...</div>)
  }

  return (
    <div className="App">
        <Container fluid className='position-fixed z-2 top-0 mt-0 pt-3 bg-white'>
          <Row>
            <Col sm="2">
              <h3>TSD</h3>
            </Col>
            <Col sm="2" className='text-sm-end'>
              { location.pathname === '/' && <NavLink className={'btn btn-outline-primary'} to="/suppliers">Suppliers {selectedSearchOptions.length > 0 && <Badge pill>{filteredOrders.length}</Badge>}</NavLink> }
              { location.pathname === '/suppliers' && <NavLink className={'btn btn-outline-primary'} to="/">Services {selectedSearchOptions.length > 0 && <Badge pill>{filteredServices.length}</Badge>}</NavLink> }
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
        <div className="nav-spacer bg-white z-1"></div>
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
              orders={orders.current}
              suppliers={suppliers}
            />
          } />
          <Route path="/suppliers" element={
            <SuppliersSpareParts filteredOrders={filteredOrders} 
              setFilteredOrders={setFilteredOrders} 
              orders={orders.current} 
              suppliers={suppliers} 
              spareParts={spareParts} 
              vehicles={vehicles}
              doFetchSpareParts={fetchSpareParts.bind(null, apiUrl, setSpareParts, setSearchOptions)}
            />} />
        </Routes>
    </div>
  );
}

export default App;