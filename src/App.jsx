import { useEffect, useState, useRef, useCallback } from 'react';
import { Route, Routes} from 'react-router-dom';
import ServiceListing from './ServiceListing';
import Spinner from 'react-bootstrap/Spinner';
import SuppliersSpareParts from './suppliers/SuppliersSpareParts';

import './App.css'
import fetchCompanies from './companies/fetchCompanies';
import { fetchSupplierSpareParts, fetchWithUsageSupplierSpareParts } from './suppliers/fetchSupplierSpareParts';
import fetchVehicles from './vehicles/fetchVehicles';
import fetchSuppliers from './suppliers/fetchSuppliers';
import fetchSparePartUsages from './spare-parts/fetchSparePartUsages';
import fetchServices, { fetchFewPagesServices } from './fetchServices';
import autoRefreshWorker, { clearState } from './autoRefreshWorker';
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
import { useService } from './services/ServiceContextProvider';
import { useSupplierOrders } from './suppliers/SupplierOrderContextProvider';

function App() {
  const apiUrl = process.env.REACT_APP_API_URL

  const [loading, setLoading] = useState(false)
  const [loadingTime, setLoadingTime] = useState(0)

  // the services and orders from supplier
  const [totalFilteredServices, setTotalFilteredServices] = useState(0)
  const transactions = useService()

  const [totalFilteredOrders, setTotalFilteredOrders] = useState(0)
  const supplierOrders = useSupplierOrders()

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
  const clearCount = () => {
    setTotalFilteredOrders(0)
    setTotalFilteredServices(0)
  }
  const storeSelectedSearchOptions = (opts=[]) => {
    setSelectedSearchOptions(opts)
    clearCount()
    if (opts && opts.length > 0) {
      opts.forEach(opt => searchedOptions.current.add(opt.name))
    }
  }
  const [searchByDate, setSearchByDate] = useState(false)
  const [selectedSearchDate, setSelectedSearchDate] = useState()

  const [totalSpareParts, setTotalSpareParts] = useState(0)

  // domain data
  const [companies, setCompanies] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [taskTemplates, setTaskTemplates] = useState([])
  
  const filterTimeoutRef = useRef()

  // to be used on .filter
  const filterServices = (options=[]) => {
    clearTimeout(filterTimeoutRef.current)
    if (!options || options.length === 0) {
      storeSelectedSearchOptions([])
      clearCount()
      return
    }

    if (options.length === searchedOptions.current.size && 
          options.map(opt => opt.name).every(v => searchedOptions.current.has(v))) {
      setSelectedSearchOptions(options)
      clearCount()
    }
    else {
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

  const refreshServices = useCallback(() =>
      selectedSearchOptions.length > 0
          ? fetchServices(apiUrl, transactions, searchedOptions).then(() => filterServices(selectedSearchOptions))
          : fetchServices(apiUrl, transactions, searchedOptions)
  , [apiUrl, selectedSearchOptions])
  const refreshFewPagesServices = useCallback(() => fetchFewPagesServices(apiUrl, transactions, searchedOptions), [apiUrl])

  const refreshSupplierSpareParts = useCallback(() => fetchSupplierSpareParts(apiUrl, supplierOrders), [apiUrl])
  const refreshWithUsageSupplierSpareParts = useCallback(() => fetchWithUsageSupplierSpareParts(apiUrl, supplierOrders), [apiUrl])

  const onNewServiceCreated = saveService.bind(this, setLoading, transactions, refreshSparePartUsages, clearState)
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
              refreshSupplierSpareParts()
              .then(() => refreshServices())
          })
        })
      })

      return () => clearTimeout(sparePartFetchTimer)
  }, []);

  useEffect(() => {
      const fetchStatsTimer = setInterval(() => {
        autoRefreshWorker(setLoading, 
          {
            'workshop_service': refreshServices,
            'mig_supplier_spare_parts': refreshSupplierSpareParts,
            'spare_part_usages': refreshSparePartUsages,
          }
        )
      }, 30000)

      return () => clearInterval(fetchStatsTimer)
  }, [refreshServices])

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
            toastBoxMessage,
            totalSpareParts}}
          ></NavigationBar>
        <Routes>
          <Route exact path="/" element={
            <ServiceListing
              setTotalFilteredServices={setTotalFilteredServices}
              vehicles={vehicles}
              setVehicles={setVehicles}
              taskTemplates={taskTemplates}
              setSelectedSearchOptions={setSelectedSearchOptions}
              selectedSearchOptions={selectedSearchOptions}
              selectedSearchDate={selectedSearchDate}
              suppliers={suppliers}
              sparePartUsages={sparePartUsages}
              refreshSparePartUsages={refreshSparePartUsages}
              onNewVehicleCreated={onNewVehicleCreated}
              setLoading={setLoading}
              onNewServiceCreated={onNewServiceCreated}
              removeTask={removeTask}
            />
          } />
          <Route exact path="/services-overview" element={
            <YearMonthView
              suppliers={suppliers} 
              taskTemplates={taskTemplates} 
            />
          } />
          <Route exact path="/workmanships" element={
            <InProgressTaskFocusListing
              taskTemplates={taskTemplates}
              suppliers={suppliers}
              onNewServiceCreated={onNewServiceCreated}
              removeTask={removeTask}
              vehicles={vehicles}
              companies={companies}
            />
          } />
          <Route path="/orders" element={
            <SuppliersSpareParts
              setTotalFilteredOrders={setTotalFilteredOrders}
              suppliers={suppliers} 
              vehicles={vehicles}
              sparePartUsages={sparePartUsages}
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
              suppliers={suppliers}
              selectedSearchOptions={selectedSearchOptions}
              totalSpareParts={totalSpareParts}
              setTotalSpareParts={setTotalSpareParts}
            />} />
        </Routes>
        </Container>
    </Container>
  );
}

export default App;