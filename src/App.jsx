import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Route, Routes} from 'react-router-dom';
import ServiceListing from './ServiceListing';
import Spinner from 'react-bootstrap/Spinner';
import SuppliersSpareParts from './suppliers/SuppliersSpareParts';
import fetchSpareParts from './spare-parts/fetchSpareParts';

import './App.css'
import fetchCompanies from './companies/fetchCompanies';
import { fetchSupplierSpareParts, fetchWithUsageSupplierSpareParts } from './suppliers/fetchSupplierSpareParts';
import fetchVehicles from './vehicles/fetchVehicles';
import fetchSuppliers from './suppliers/fetchSuppliers';
import fetchSparePartUsages from './spare-parts/fetchSparePartUsages';
import fetchServices, { fetchFewPagesServices } from './fetchServices';
import autoRefreshWorker from './autoRefreshWorker';
import ServiceTransactions from './ServiceTransactions';
import NavigationBar from './NavigationBar';
import Vehicles from './vehicles/Vehicles';

import { doFilterServices, doInAppFilterOrders, doInAppFilterServices } from './fuzzySearch';
import { Container } from 'react-bootstrap';

/***
 * Date: {
 *  vehicle: [transactions]
 * }
 */

function App() {
  const apiUrl = process.env.REACT_APP_API_URL

  const [loading, setLoading] = useState(false)
  const [loadingTime, setLoadingTime] = useState(0)

  // the services and orders from supplier
  const services = useRef(new ServiceTransactions([]))
  const [filteredServices, setFilteredServices] = useState()

  const orders = useRef({listing:[], mapping:{}})
  const [filteredOrders, setFilteredOrders] = useState()

  const [sparePartUsages, setSparePartUsages] = useState([])

  // toast box for notification
  const [showToastBox, setShowToastBox] = useState(false)
  const [toastBoxMessage, setToastBoxMessage] = useState()

  const showToastMessage = (msg) => {
    try {
      setToastBoxMessage(msg)
    }
    finally {
      console.trace('who is showing toast that causing error')
      setShowToastBox(true)
    }
  }
  
  // search box
  const [searchOptions, setSearchOptions] = useState([])
  const [selectedSearchOptions, setSelectedSearchOptions] = useState([])
  const searchedOptions = useRef(new Set())
  const storeSelectedSearchOptions = (opts=[]) => {
    setSelectedSearchOptions(opts)
    if (opts && opts.length > 0) {
      opts.forEach(opt => searchedOptions.current.add(opt.name))
    }
  }
  const [searchByDate, setSearchByDate] = useState(false)

  // domain data
  const [companies, setCompanies] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [spareParts, setSpareParts] = useState([])
  // for ordering purpose, adding for service can only take addAllowed = true
  const [orderSpareParts, setOrderSpareParts] = useState([])
  
  const filterTimeoutRef = useRef()

  const filterServices = (options=[]) => {
    if (!options || options.length === 0) {
      clearTimeout(filterTimeoutRef.current)
      setFilteredServices(services.current.transactions)
      setFilteredOrders(orders.current.listing)
      storeSelectedSearchOptions([])
      return
    }

    if (options.map(opt => opt.name).every(v => searchedOptions.current.has(v))) {
      doInAppFilterServices(options, services, orders, setFilteredServices);
      doInAppFilterOrders(options, orders, setFilteredOrders, sparePartUsages)
      setSelectedSearchOptions(options)
    }
    else {
      clearTimeout(filterTimeoutRef.current)
      filterTimeoutRef.current = setTimeout(() => doFilterServices(
        options, services, setFilteredServices, sparePartUsages, orders, setFilteredOrders, storeSelectedSearchOptions), 600)
    }
  }

  const filterByDate = (val) => {
    if (services.current) {
      const searchedFilteredServices = []
      for (const v of services.current.transactions) {
        if (v.startDate === val) {
          searchedFilteredServices.push(v)
        }
      }

      searchedFilteredServices.sort((left, right) => left.startDate < right.startDate)
      setFilteredServices(searchedFilteredServices)
    }

    if (orders.current) {
      const searchedFilteredOrders = []
      for (const order of orders.current.listing) {
        if (order.invoiceDate === val) {
          searchedFilteredOrders.push(order)
        }
      }
      setFilteredOrders(searchedFilteredOrders)
    }
  }

  const clearFilterDate = () => {
    setSearchByDate(false)
    setSearchOptions([])
    setFilteredServices(services.current.transactions)
    setFilteredOrders(orders.current.listing)
  }

  const onNewVehicleCreated = async (vehicleNo) => {
    if (!/([A-Z]{1,3})\s([\d]{1,4})(\s([A-Z]{1,2}))?/.test(vehicleNo)) {
      alert('Wrong vehicle no format')
      return
    }

    return fetch(`${apiUrl}/vehicles`, {
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
    .then(veh => {
      fetchVehicles(apiUrl, setVehicles, setSearchOptions)
      return veh
    })
  }

  const refreshCompanies = useCallback(() => fetchCompanies(apiUrl, setCompanies), [apiUrl])

  const refreshSparePartUsages = useCallback(() => fetchSparePartUsages(apiUrl, setSparePartUsages, showToastMessage), [apiUrl])

  const refreshSpareParts = useCallback(() => fetchSpareParts(apiUrl, setSpareParts, setSearchOptions, setOrderSpareParts), [apiUrl])

  const refreshServices = useCallback(() => fetchServices(apiUrl, services, setFilteredServices, searchedOptions), [apiUrl])
  const refreshFewPagesServices = useCallback(() => fetchFewPagesServices(apiUrl, services, setFilteredServices, searchedOptions), [apiUrl])

  const refreshSupplierSpareParts = useCallback(() => fetchSupplierSpareParts(apiUrl, orders, setFilteredOrders), [apiUrl])
  const refreshWithUsageSupplierSpareParts = useCallback(() => fetchWithUsageSupplierSpareParts(apiUrl, orders, setFilteredOrders), [apiUrl])

  useEffect(() => {
      setLoading(true)
      requestAnimationFrame(async () => {
        fetchSuppliers(apiUrl, setSuppliers)
        .then(() => refreshWithUsageSupplierSpareParts()
          .then(() => Promise.all([
                  refreshFewPagesServices(),
                  refreshSparePartUsages(),
              
                  refreshCompanies(),
                  fetchVehicles(apiUrl, setVehicles, setSearchOptions),
                ]))
        .then( () => setLoading(false) ))
      })

      const sparePartFetchTimer = setTimeout(() => {
        Promise.all([
          refreshSupplierSpareParts(),
          refreshSpareParts()
        ]).then(() => refreshServices())
      })

      const fetchStatsTimer = setInterval(() => {
        autoRefreshWorker(setLoading, 
          {
            'workshop_service': refreshServices,
            'mig_supplier_spare_parts': refreshSupplierSpareParts,
            'mig_spare_parts': refreshSpareParts,
            'spare_part_usages': refreshSparePartUsages,
          }
        )
      }, 30000)

      return () => { 
        clearInterval(fetchStatsTimer)
        clearTimeout(sparePartFetchTimer)
      };
      
  }, [refreshServices, refreshSupplierSpareParts, refreshSparePartUsages, refreshCompanies, refreshSpareParts, apiUrl]);

  useEffect(() => {
    let loadingTimer 
    if (loading) {
      loadingTimer = setInterval(() => {
        setLoadingTime(val => val + 49)
      }, 49)
    }

    return () => { clearInterval(loadingTimer); setLoadingTime(0) }
  }, [loading])

  return (
    <Container fluid>
        {loading && (
          <div className="loading-overlay">
            <Spinner animation="border" variant="primary">{loadingTime}</Spinner>
          </div>
        )}
        <Container id="content" className={(loading ? ' blurred ' : '')}>
        <NavigationBar
            {...{
            clearFilterDate,
            filterByDate,
            filterServices,
            filteredOrders,
            filteredServices,
            searchByDate,
            searchOptions,
            selectedSearchOptions,
            setSearchByDate,
            setShowToastBox,
            showToastBox,
            toastBoxMessage}}
          ></NavigationBar>
        <Routes>
          <Route exact path="/" element={
            <ServiceListing services={services}
              vehicles={vehicles}
              setVehicles={setVehicles}
              spareParts={spareParts}
              setFilteredServices={setFilteredServices}
              filteredServices={filteredServices}
              keywordSearch={() => {
                if (!selectedSearchOptions || selectedSearchOptions.length === 0) {
                  setFilteredServices(services.current.transactions) 
                }
                else {
                  doFilterServices(selectedSearchOptions)}
                }
              }
              selectedSearchOptions={selectedSearchOptions}
              orders={orders.current}
              suppliers={suppliers}
              sparePartUsages={sparePartUsages}
              refreshSparePartUsages={refreshSparePartUsages}
              refreshSpareParts={refreshSpareParts}
              onNewVehicleCreated={onNewVehicleCreated}
              setLoading={setLoading}
            />
          } />
          <Route path="/orders" element={
            <SuppliersSpareParts filteredOrders={filteredOrders} 
              setFilteredOrders={setFilteredOrders} 
              orders={orders.current} 
              suppliers={suppliers} 
              spareParts={orderSpareParts} 
              vehicles={vehicles}
              sparePartUsages={sparePartUsages}
              refreshSpareParts={refreshSpareParts}
              refreshSparePartUsages={refreshSparePartUsages}
              refreshServices={refreshServices}
              onNewVehicleCreated={onNewVehicleCreated}
              setLoading={setLoading}
              selectedSearchOptions={selectedSearchOptions}
              filterServices={filterServices}
              showToastMessage={showToastMessage}
            />} />
          <Route path="/vehicles" element={ 
            <Vehicles vehicles={vehicles} 
              setVehicles={setVehicles} 
              companies={companies} 
            />} />
        </Routes>
        </Container>
    </Container>
  );
}

export default App;