import React, { useEffect, useState, useRef } from 'react';
import { Route, Routes, NavLink, useLocation } from 'react-router-dom';
import ServiceListing from './ServiceListing';
import { Badge, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import SuppliersSpareParts from './suppliers/SuppliersSpareParts';
import fetchSpareParts from './spare-parts/fetchSpareParts';

import './App.css'
import fetchSupplierSpareParts from './suppliers/fetchSupplierSpareParts';
import fetchVehicles from './vehicles/fetchVehicles';
import fetchSuppliers from './suppliers/fetchSuppliers';
import fetchSparePartUsages from './spare-parts/fetchSparePartUsages';
import fetchServices from './fetchServices';

/***
 * Date: {
 *  vehicle: [transactions]
 * }
 */

function App() {
  const location = useLocation()
  const apiUrl = process.env.REACT_APP_API_URL

  const [loading, setLoading] = useState(false)

  // the services and orders from supplier
  const services = useRef()
  const [filteredServices, setFilteredServices] = useState()

  const orders = useRef()
  const [filteredOrders, setFilteredOrders] = useState()

  const [sparePartUsages, setSparePartUsages] = useState([])
  
  // search box
  const [searchOptions, setSearchOptions] = useState([])
  const [selectedSearchOptions, setSelectedSearchOptions] = useState([])
  const [searchByDate, setSearchByDate] = useState(false)

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
            if (options.some(val => item.partName.toUpperCase().includes(val.name.toUpperCase()))) {
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

  const filterByDate = (val) => {
    if (services.current) {
      const searchedFilteredServices = []
      for (const v of services.current.entriedServices()) {
        if (v[0] === val) {
          searchedFilteredServices.push([v[0], v[1]])
        }
      }

      searchedFilteredServices.sort((left, right) => left[0] < right[0])
      setFilteredServices(searchedFilteredServices)
    }

    if (orders.current) {
      const searchedFilteredOrders = []
      for (const order of orders.current) {
        if (order.invoiceDate === val) {
          searchedFilteredOrders.push(order)
        }
      }
      setFilteredOrders(searchedFilteredOrders)
    }
  }

  const clearFilterDate = () => {
    setSearchByDate(false)
    setFilteredServices(services.current.entriedServices())
    setFilteredOrders(orders.current)
  }

  useEffect(() => {
      setLoading(true)
      requestAnimationFrame(async () => {
        Promise.all([
          fetchServices(apiUrl, services, setFilteredServices),

          fetchSupplierSpareParts(apiUrl, orders, setFilteredOrders),
          fetchSparePartUsages(apiUrl, setSparePartUsages),
      
          fetchVehicles(apiUrl, setVehicles, setSearchOptions),
          fetchSpareParts(apiUrl, setSpareParts, setSearchOptions),
          fetchSuppliers(apiUrl, setSuppliers)
        ])
        .then( () => setLoading(false) )
      })
  }, []);

  const onNewVehicleCreated = (vehicleNo) => {
      if (!/([A-Z]{1,3})\s([\d]{1,4})(\s([A-Z]{1,2}))?/.test(vehicleNo)) {
        alert('Wrong vehicle no format')
        return
      }

      fetch(`${apiUrl}/vehicles`, {
          method: 'POST',
          body: JSON.stringify({
            vehicleNo: vehicleNo,
          }),
          mode: 'cors',
          headers: {
              'Content-type': 'application/json'
          }
      })
      .then(res => res.json())
      .then(_ => {
        fetchVehicles(apiUrl, setVehicles, setSearchOptions)
      })
  }

  const refreshSparePartUsages = () => {
    setLoading(true)
    requestAnimationFrame(async () => {
      fetchSparePartUsages(apiUrl, setSparePartUsages)
        .then( () => setLoading(false) )
    })
  }

  const refreshSpareParts = () => {
    setLoading(true)
    requestAnimationFrame(async () => {
      fetchSpareParts(apiUrl, setSpareParts, setSearchOptions)
        .then( () => setLoading(false) )
    })
  }

  const refreshServices = () => {
    setLoading(true)
    requestAnimationFrame(async () => {
      fetchServices(apiUrl, services, setFilteredServices)
        .then( () => setLoading(false) )
    })
  }

  return (
    <div className="App">
        {loading && (
          <div className="loading-overlay">
            <Spinner animation="border" variant="primary" />
          </div>
        )}
        <Container fluid className={'position-fixed z-2 top-0 mt-0 py-3 bg-white' + (loading ? ' blurred ' : '')}>
          <Row>
            <Col sm="2">
              <h3>TSD</h3>
            </Col>
            <Col sm="2" className='text-sm-end'>
              { location.pathname === '/' && <NavLink className={'btn btn-outline-primary'} to="/suppliers"><i className="bi bi-shop"></i> Suppliers {selectedSearchOptions.length > 0 && <Badge pill>{filteredOrders.length}</Badge>}</NavLink> }
              { location.pathname === '/suppliers' && <NavLink className={'btn btn-outline-primary'} to="/"><i className="bi bi-file-earmark-text-fill"></i> Services {selectedSearchOptions.length > 0 && <Badge pill>{filteredServices.length}</Badge>}</NavLink> }
            </Col>
            {!searchByDate &&
            <Col>
              <Form.Group>
              <InputGroup>
              <InputGroup.Text><i className="bi bi-truck"></i></InputGroup.Text>
              <InputGroup.Text><i className="bi bi-tools"></i></InputGroup.Text>
                <Typeahead
                    id="search-multiple"
                    labelKey="name"
                    multiple
                    onChange={filterServices}
                    options={searchOptions}
                    placeholder="Choose by vehicle(s) and/or spart part(s)"
                    selected={selectedSearchOptions}
                  />
                  <InputGroup.Text><i className="bi bi-calendar-event" role="button" onClick={() => setSearchByDate(true)}></i></InputGroup.Text>
                </InputGroup>
                </Form.Group>
            </Col> }
            {searchByDate && 
            <Col>
              <Form.Group>
              <InputGroup>
                <InputGroup.Text>Choose a date</InputGroup.Text>
                <InputGroup.Text><i className="bi bi-x-circle" role="button" onClick={clearFilterDate}></i></InputGroup.Text>
                <Form.Control type='date' placeholder='Choose a date' onChange={(e) => filterByDate(e.target.value)}></Form.Control>
              </InputGroup>
              </Form.Group>
            </Col>
            }
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
              sparePartUsages={sparePartUsages}
              refreshSparePartUsages={refreshSparePartUsages}
              refreshSpareParts={refreshSpareParts}
              onNewVehicleCreated={onNewVehicleCreated}
              setLoading={setLoading}
            />
          } />
          <Route path="/suppliers" element={
            <SuppliersSpareParts filteredOrders={filteredOrders} 
              setFilteredOrders={setFilteredOrders} 
              orders={orders.current} 
              suppliers={suppliers} 
              spareParts={spareParts} 
              vehicles={vehicles}
              sparePartUsages={sparePartUsages}
              refreshSpareParts={refreshSpareParts}
              refreshSparePartUsages={refreshSparePartUsages}
              refreshServices={refreshServices}
              onNewVehicleCreated={onNewVehicleCreated}
              setLoading={setLoading}
            />} />
        </Routes>
    </div>
  );
}

export default App;