import { useEffect, useState, useRef, useCallback } from 'react';
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
import autoRefreshWorker, { clearState } from './autoRefreshWorker';
import ServiceTransactions from './ServiceTransactions';
import NavigationBar from './NavigationBar';
import Vehicles from './vehicles/Vehicles';

import { doFilterServices } from './search/fuzzySearch';
import { Container } from 'react-bootstrap';
import SpareParts from './spare-parts/SpareParts';
import fetchTasks from './services/fetchTasks';
import InProgressTaskFocusListing from './services/InProgressTaskFocusListing';
import saveService from './services/saveService';
import removeServiceTask from './services/removeServiceTask';
import SchedulingCalendarView from './schedule/SchedulingCalendarView';
import YearMonthView from './services/YearMonthView';
import SupplierOrders from './suppliers/SupplierOrders';

function App() {
  const apiUrl = process.env.REACT_APP_API_URL

  const [loading, setLoading] = useState(false)
  const [loadingTime, setLoadingTime] = useState(0)

  // the services and orders from supplier
  
  const [services, setServices] = useState([])
  const [totalFilteredServices, setTotalFilteredServices] = useState(0)
  const transactions = useRef(new ServiceTransactions([], setServices))

  const [orders, setOrders] = useState([])
  const [totalFilteredOrders, setTotalFilteredOrders] = useState(0)
  const supplierOrders = useRef(new SupplierOrders([], setOrders))

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
    setSelectedSearchOptions([...opts])
    if (opts && opts.length > 0) {
      opts.forEach(opt => searchedOptions.current.add(opt.name))
    }
  }
  const [searchByDate, setSearchByDate] = useState(false)
  const [selectedSearchDate, setSelectedSearchDate] = useState()

  // domain data
  const [companies, setCompanies] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [spareParts, setSpareParts] = useState([])
  const [taskTemplates, setTaskTemplates] = useState([])
  // for ordering purpose, adding for service can only take addAllowed = true
  const [orderSpareParts, setOrderSpareParts] = useState([])
  
  const filterTimeoutRef = useRef()

  // to be used on .filter
  const filterServices = (options=[]) => {
    if (!options || options.length === 0) {
      clearTimeout(filterTimeoutRef.current)
      storeSelectedSearchOptions([])
      return
    }

    if (options.length === searchedOptions.current.size && 
          options.map(opt => opt.name).every(v => searchedOptions.current.has(v))) {
      setSelectedSearchOptions(options)
    }
    else {
      clearTimeout(filterTimeoutRef.current)
      filterTimeoutRef.current = setTimeout(() => doFilterServices(
        options, transactions, storeSelectedSearchOptions), 600)
    }
  }

  const clearFilterDate = () => {
    setSearchByDate(false)
    setSelectedSearchDate()
  }

  const onNewVehicleCreated = async (vehicleNo) => {
    if (!/([A-Z]{1,3})\s([\d]{1,4})(\s([A-Z]{1,2}))?/.test(vehicleNo)) {
      alert('Wrong vehicle no format: ' + vehicleNo)
      return
    }

    return fetch(`${apiUrl}/api/vehicles`, {
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

  const refreshServices = useCallback(() => fetchServices(apiUrl, transactions, searchedOptions), [apiUrl])
  const refreshFewPagesServices = useCallback(() => fetchFewPagesServices(apiUrl, transactions, searchedOptions), [apiUrl])

  const refreshSupplierSpareParts = useCallback(() => fetchSupplierSpareParts(apiUrl, supplierOrders), [apiUrl])
  const refreshWithUsageSupplierSpareParts = useCallback(() => fetchWithUsageSupplierSpareParts(apiUrl, supplierOrders), [apiUrl])

  const onNewServiceCreated = saveService.bind(this, setLoading, transactions, refreshSpareParts, refreshSparePartUsages, clearState)
  const removeTask = removeServiceTask.bind(this, setLoading, transactions, clearState);

  useEffect(() => {
      let sparePartFetchTimer
      setLoading(true)
      requestAnimationFrame(async () => {
        fetchSuppliers(apiUrl, setSuppliers)
        .then(() => fetchTasks(setTaskTemplates))
        .then(() => refreshWithUsageSupplierSpareParts()
          .then(() => Promise.all([
                  refreshFewPagesServices(),
                  refreshSparePartUsages(),
              
                  refreshCompanies(),
                  fetchVehicles(apiUrl, setVehicles, setSearchOptions),
                ]))
        .then( () => setLoading(false) ))
        .then(() => {
          sparePartFetchTimer = setTimeout(() => {
            Promise.all([
              refreshSupplierSpareParts(),
              refreshSpareParts()
            ]).then(() => refreshServices())
          })
        })
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
        <Container fluid id="content" className={(loading ? ' blurred ' : '')}>
        <NavigationBar
            {...{
            clearFilterDate,
            filterServices,
            totalFilteredOrders,
            totalFilteredServices,
            searchByDate,
            searchOptions,
            selectedSearchOptions,
            setSearchByDate,
            selectedSearchDate,
            setSelectedSearchDate,
            setShowToastBox,
            showToastBox,
            toastBoxMessage}}
          ></NavigationBar>
        <Routes>
          <Route exact path="/" element={
            <ServiceListing services={services}
              transactions={transactions}
              setTotalFilteredServices={setTotalFilteredServices}
              vehicles={vehicles}
              setVehicles={setVehicles}
              spareParts={spareParts}
              taskTemplates={taskTemplates}
              setSelectedSearchOptions={setSelectedSearchOptions}
              selectedSearchOptions={selectedSearchOptions}
              selectedSearchDate={selectedSearchDate}
              orders={supplierOrders.current}
              suppliers={suppliers}
              sparePartUsages={sparePartUsages}
              refreshSparePartUsages={refreshSparePartUsages}
              refreshSpareParts={refreshSpareParts}
              onNewVehicleCreated={onNewVehicleCreated}
              setLoading={setLoading}
              onNewServiceCreated={onNewServiceCreated}
              removeTask={removeTask}
            />
          } />
          <Route exact path="/services-overview" element={
            <YearMonthView transactions={transactions} 
              suppliers={suppliers} 
              orders={supplierOrders.current}
              taskTemplates={taskTemplates} 
            />
          } />
          <Route exact path="/workmanships" element={
            <InProgressTaskFocusListing services={services}
              taskTemplates={taskTemplates}
              orders={supplierOrders.current}
              suppliers={suppliers}
              onNewServiceCreated={onNewServiceCreated}
              removeTask={removeTask}
              vehicles={vehicles}
              companies={companies}
            />
          } />
          <Route path="/orders" element={
            <SuppliersSpareParts
              orders={orders}
              supplierOrders={supplierOrders} 
              setTotalFilteredOrders={setTotalFilteredOrders}
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
              selectedSearchDate={selectedSearchDate}
              filterServices={filterServices}
              showToastMessage={showToastMessage}
            />} />
          <Route path="/vehicles" element={ 
            <Vehicles vehicles={vehicles} 
              setVehicles={setVehicles} 
              companies={companies}
              selectedSearchOptions={selectedSearchOptions}
            />} />
          <Route path="/schedules" element={
            <SchedulingCalendarView vehicles={vehicles} onNewVehicleCreated={onNewVehicleCreated} />
          } />
          <Route path="/spare-parts" element={ 
            <SpareParts vehicles={vehicles} 
              orders={supplierOrders.current}
              suppliers={suppliers}
            />} />
        </Routes>
        </Container>
    </Container>
  );
}

export default App;