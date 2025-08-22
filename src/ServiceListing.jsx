import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Card, Col, Container, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import ServiceDialog from './services/ServiceDialog';
import CompletionLabel from './components/CompletionLabel';
import { chunkArray } from './utils/arrayUtils';
import { clearState } from './autoRefreshWorker';
import OrderTooltip from './services/OrderTooltip';
import TransactionTypes from './components/TransactionTypes';
import { Calendar, Foreman, NoteTaking, Tools } from './Icons';
import ServiceNoteTakingDialog from './services/ServiceNoteTakingDialog';
import ServiceMediaDialog from './services/ServiceMediaDialog';
import HoverPriceTag from './components/HoverPriceTag';
import ResponsivePagination from './components/ResponsivePagination';
import { applyFilterOnServices } from './search/fuzzySearch';
import { useNavigate } from 'react-router-dom';
import { useService } from './services/ServiceContextProvider';
import { useSupplierOrders } from './suppliers/SupplierOrderContextProvider';
import { addDaysToDateStr } from './utils/dateUtils';
import MigratedItemToSupplierOrderDialog from './services/MigratedItemToSupplierOrderDialog';

/**
 * 
 * @param {Object} props 
 * @param {React.SetStateAction<number>} props.setTotalFilteredServices
 * @param {Function} props.refreshSparePartUsages
 * @param {import('./vehicles/Vehicles').Vehicle[]} props.vehicles
 * @param {React.SetStateAction<import('./vehicles/Vehicles').Vehicle[]>} props.setVehicles
 * @param {import('./ServiceTransactions').SparePartUsage[]} props.sparePartUsages
 * @param {import('./suppliers/SupplierOrders').Supplier[]} props.suppliers
 * @param {import('./ServiceTransactions').TaskTemplate[]} props.taskTemplates
 * @param {import('./App').CreateNewVehicleCallback} props.onNewVehicleCreated
 * @param {React.SetStateAction<boolean>} props.setLoading
 * @param {import('./App').SearchOption[]} props.selectedSearchOptions
 * @param {React.SetStateAction<import('./App').SearchOption[]>} props.setSelectedSearchOptions
 * @param {string} props.selectedSearchDate date to search service, in format of '2005-05-05'
 * @param {import('./App').CreateNewServiceCallback} props.onNewServiceCreated
 * @param {Function} props.removeTask
 * @param {Function} props.showToastMessage
 * @returns 
 */
function ServiceListing({
    setTotalFilteredServices,
    refreshSparePartUsages, 
    vehicles, setVehicles, sparePartUsages,
    suppliers, taskTemplates,
    onNewVehicleCreated, setLoading,
    selectedSearchOptions, setSelectedSearchOptions, 
    selectedSearchDate,
    onNewServiceCreated, 
    removeTask,
    showToastMessage}) {
  
  const transactions = useService()
  const orders = useSupplierOrders()

  const apiUrl = process.env.REACT_APP_API_URL
  const [showModal, setShowModal] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [migratedItem, setMigratedItem] = useState()
  const serviceTransaction = useRef()

  const [activePage, setActivePage] = useState(1)
  const filteredServices = applyFilterOnServices(selectedSearchOptions, selectedSearchDate, vehicles, transactions.services(), orders)
  /** @type {import('./ServiceTransactions').WorkshopService[][]} */
  const chunkedItems = chunkArray(filteredServices, 10)
  const totalPages = chunkedItems.length;

  const [prevSelectedSearchOptions, setPrevSelectedSearchOptions] = useState(selectedSearchOptions)
  const [prevSelectedSearchDate, setPrevSelectedSearchDate] = useState(selectedSearchDate)

  if (prevSelectedSearchOptions !== selectedSearchOptions || prevSelectedSearchDate !== selectedSearchDate) {
    setActivePage(1)

    if (prevSelectedSearchOptions !== selectedSearchOptions) {
      setPrevSelectedSearchOptions(selectedSearchOptions)
    }
    if (prevSelectedSearchDate !== selectedSearchDate) {
      setPrevSelectedSearchDate(selectedSearchDate)
    }
  }

  const navigate = useNavigate()

  const addNewServiceTransaction = (startDate) => {
    serviceTransaction.current = {
      startDate: startDate,
      items: [{ partName: 'Engine Oil 20w-50' }]
    };
    setShowModal(true)
  }

  const addNewItemForVehicle = (service) => {
    serviceTransaction.current = {
      id: service.id,
      startDate: service.startDate,
      vehicleNo: service.vehicleNo,
      transactionTypes: service.transactionTypes,
      mileageKm: service.mileageKm,
      notes: service.notes,
      items: [{ partName: 'Engine Oil 20w-50' }],
      sparePartsMargin: service.sparePartsMargin
    };
    setShowModal(true)
  }

  const noteForService = (service) => {
    serviceTransaction.current = {
      id: service.id,
      startDate: service.startDate,
      vehicleNo: service.vehicleNo,
      transactionTypes: service.transactionTypes,
      mileageKm: service.mileageKm,
      notes: service.notes
    };
    setShowNote(true)
  }

  const mediaForService = (service) => {
    serviceTransaction.current = {
      id: service.id,
      startDate: service.startDate,
      vehicleNo: service.vehicleNo,
      transactionTypes: service.transactionTypes,
      mileageKm: service.mileageKm,
      notes: service.notes
    };
    setShowMedia(true)
  }

  const removeTransaction = (serviceId, sparePartUsageId) => {
    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/api/spare-part-utilizations/${sparePartUsageId}`, {
        method: 'DELETE', 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(deleteId => {
        if (deleteId !== sparePartUsageId) {
          throw Error(`seems nothing deleted, returning ${JSON.stringify(deleteId)}`)
        }
        transactions.removeTransaction(serviceId, sparePartUsageId)
      })
      .then(() => refreshSparePartUsages())
      .then(() => clearState())
      .catch(err => showToastMessage(err.message))
      .finally(() => setLoading(false))
    })
  }

  const completeService = (service, date) => {
    setLoading(true)
    requestAnimationFrame(() => {
      service.completionDate = date
 
      fetch(`${apiUrl}/api/workshop-services?op=COMPLETE`, {
        method: 'POST', 
        body: JSON.stringify(service), 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(newService => {
        transactions.updateTransaction(newService)
      })
      .then(() => clearState())
      .finally(() => setLoading(false))
    })
  }

  const onSaveNote = (service) => {
    setLoading(true)
    requestAnimationFrame(() => { 
      fetch(`${apiUrl}/api/workshop-services?op=NOTE`, {
        method: 'POST', 
        body: JSON.stringify(service), 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(newService => {
        transactions.updateForNote(newService)
      })
      .then(() => clearState())
      .finally(() => setLoading(false))
    })
  }

  const onSaveMedia = (service, file, afterSaveMedia) => {
    setLoading(true)
    requestAnimationFrame(() => {
      const formData = new FormData()
      formData.append("file", file, file.name)

      fetch(`${apiUrl}/api/workshop-services/${service.id}/medias`, {
        method: 'POST', 
        body: formData
      })
      .then(res => res.text())
      .then(mediaId => {
        if (!isFinite(mediaId)) {
          throw new Error(`uploaded media failed, not a proper id ${mediaId}`)
        }
        afterSaveMedia && afterSaveMedia(mediaId)
      })
      .catch(err => showToastMessage(err.message))
      .finally(() => setLoading(false))
    })
  }

  const deleteService = (ws) => {
    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/api/workshop-services/${ws.id}`, {
        method: 'DELETE',
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(id => {
        if (ws.id !== id) {
          throw Error(`seems nothing deleted, returning ${JSON.stringify(id)}`)
        }
        transactions.removeService(ws)
      })
      .then(() => clearState())
      .then(() => refreshSparePartUsages())
      .catch(err => showToastMessage(err.message))
      .finally(() => setLoading(false))
    })
  }

  const loadWorkshopService = (ws) => {
    fetch(`${apiUrl}/api/workshop-services/${ws.id}`)
    .then(resp => resp.json())
    .then(wsJson => {
      transactions.updateTransaction(wsJson)
    })
  }

  const migrateToSparePart = (spu) => {
    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/api/spare-part-utilizations`, {
        method: 'POST',
        body: JSON.stringify(spu),
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(spuJson => {
        const trx = transactions.getTransaction(spuJson.serviceId)
        // update spare part usage
        trx.sparePartUsages = (trx.sparePartUsages && [...trx.sparePartUsages, spuJson]) || [spuJson]
        // remove hand written migrated data
        const newMigratedHandWrittenSpareParts = [...trx.migratedHandWrittenSpareParts]
        newMigratedHandWrittenSpareParts.splice(newMigratedHandWrittenSpareParts.findIndex(md => md.index === spuJson.migDataIndex), 1)
        trx.migratedHandWrittenSpareParts = newMigratedHandWrittenSpareParts
        // go
        transactions.updateTransaction(trx)
        
      })
      .then(() => clearState())
      .then(() => refreshSparePartUsages())
      .finally(() => setLoading(false))
    })
  }

  useEffect(() => {
    if (selectedSearchOptions.length > 0 || selectedSearchDate) {
      //setActivePage(1)
      setTotalFilteredServices(filteredServices.length)
    }
  }, [transactions.services(), selectedSearchOptions, selectedSearchDate])

  return (
      <Container fluid>
      <ServiceDialog isShow={showModal} setShow={setShowModal} trx={serviceTransaction} 
        onNewServiceCreated={onNewServiceCreated} 
        vehicles={vehicles} setVehicles={setVehicles} 
        taskTemplates={taskTemplates}
        suppliers={suppliers}
        sparePartUsages={sparePartUsages}
        onNewVehicleCreated={onNewVehicleCreated}></ServiceDialog>
      {serviceTransaction.current && 
        <ServiceNoteTakingDialog isShow={showNote} setShowDialog={setShowNote} 
          ws={serviceTransaction.current} onSaveNote={onSaveNote}/> }
      {serviceTransaction.current && 
        <ServiceMediaDialog isShow={showMedia} setShowDialog={setShowMedia} 
          ws={serviceTransaction.current} onSaveMedia={onSaveMedia}/> }
      {migratedItem && 
        <MigratedItemToSupplierOrderDialog item={migratedItem} suppliers={suppliers} 
          sparePartUsages={sparePartUsages} onHideDialog={() => setMigratedItem()} onMigrate={(spu) => migrateToSparePart(spu)}>
        </MigratedItemToSupplierOrderDialog> }
      <Row className='mb-3'>
        <Col>
          <ResponsivePagination activePage={activePage} setActivePage={setActivePage} 
              totalPages={totalPages} />
        </Col>
        <Col className='text-end'>
          <ButtonGroup className='responsive-width-50'>
            <Button variant='secondary' onClick={() => { setSelectedSearchOptions([]); navigate('/services-overview')}}><Calendar />&nbsp;Calendar View</Button>
            <Button aria-label="Add new service" variant='success' onClick={() => addNewServiceTransaction(addDaysToDateStr(new Date(), 0))}><i className="bi bi-plus-circle-fill me-2"></i>Add New</Button>
          </ButtonGroup>
        </Col>
      </Row>
      {
        chunkedItems[activePage - 1]?.map(v =>
            <Card key={v.id} className={'mb-3'}>
              <Card.Header>
                <Row>
                  <Col xs="12" lg="2"><h5 role="button" onClick={() => navigate(`/vehicles?id=${v.vehicleId}`)} href="#">{v.vehicleNo}</h5></Col>
                  <Col xs="12" lg={{span: 12, order: 5}}><h5 className="text-body-secondary">started since {v.startDate}</h5></Col>
                  <Col xs="6" lg="8" className='mb-2'><TransactionTypes service={v} /></Col>
                  <Col xs="6" lg="2" className='text-end'>
                  {v.mileageKm > 0 && <h6><span className="text-body-secondary">At {v.mileageKm} KM</span></h6> }
                  </Col>
                </Row>
                <Row>
                  <Col xs="12" lg="8" className="mb-2">
                  <CompletionLabel ws={v}
                    onCompletion={(date) => completeService(v, date)} 
                    onDelete={() => deleteService(v)}
                    noteForService={() => noteForService(v)}
                    mediaForService={() => mediaForService(v)}></CompletionLabel>
                  </Col>
                  <Col xs="12" lg="4" className='text-lg-end fw-semibold'>
                    <h4>
                      $ {((v.migratedHandWrittenSpareParts?.reduce((acc, curr) => acc += curr.totalPrice, 0) || 0) + 
                          (v.sparePartUsages?.reduce((acc, curr) =>  acc + (curr.quantity * curr.soldPrice), 0) || 0) +
                          (v.tasks?.reduce((acc, curr) => acc += curr.quotedPrice, 0) || 0)).toFixed(2)}
                    </h4>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
              <Container fluid>
                <Row className='mb-3'>
                  <Col className='text-end'>
                  {
                  !v.completionDate && 
                    <Button className='responsive-width-25' variant='secondary' onClick={() => addNewItemForVehicle(v)}>
                      <Tools /> <Foreman /> <span>Add Item</span></Button>
                     }
                  </Col>
                </Row>
                <Row>
                  <Col className="p-0">
                    <ListGroup>
                    {v.migratedHandWrittenSpareParts?.map(vvv => {
                      return <ListGroupItem key={vvv.index}>
                        {vvv.totalPrice && <div className='price-tag text-center'>$ {vvv.totalPrice?.toFixed(2)}</div>}
                        <Row>
                          <Col xs="4" lg="2" className='fw-lighter'>{vvv.creationDate}</Col>
                          <Col xs="8" lg="6"><span role="button" aria-label={`migrate item ${vvv.itemDescription}`} className="migration-item" onClick={() => setMigratedItem({migratedItem: vvv, ws: v})}>{vvv.itemDescription}</span></Col>
                          <Col xs="12" lg="4" className='fw-lighter text-end'>{vvv.quantity > 0 && vvv.unitPrice && `${vvv.quantity} ${vvv.unit} @ $${vvv.unitPrice?.toFixed(2)}`}</Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {v.sparePartUsages?.map(vvv => {
                      const order = orders.byId(vvv.orderId) || {}
                      const supplier = suppliers.find(s => s.id === order.supplierId)
                      const totalPrice = (vvv.quantity * vvv.soldPrice).toFixed(2)

                      return <ListGroupItem key={vvv.id}>
                        {v.completionDate ? <div className='price-tag text-center'>$ {totalPrice}</div> : <HoverPriceTag className="text-center" onRemove={() => removeTransaction(v.id, vvv.id)}>$ {totalPrice}</HoverPriceTag>}
                        <Row>
                          <Col xs={{span: 6, order: 1}} lg="2" className='fw-lighter'>{vvv.usageDate}</Col>
                          <Col xs={{span: 12, order: 3}} lg="6">{ order.itemCode && !order.partName.includes(order.itemCode) && <span className='fw-lighter text-secondary'>{order.itemCode}&nbsp;</span> }<span className='fw-semibold'>{order.partName}</span> <div><OrderTooltip order={order} supplier={supplier} /></div></Col>
                          <Col xs={{span: 12, order: 4}} lg="4" className='text-end'>
                            {vvv.quantity > 0 && vvv.soldPrice && `${vvv.quantity} ${order.unit} @ $${vvv.soldPrice?.toFixed(2)}`}
                            {vvv.margin > 0 && <div><span className="text-secondary fw-lighter">original: ${order.unitPrice?.toFixed(2)} <i className="bi bi-arrow-up"></i>{vvv.margin}%</span></div> }
                          </Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {v.tasks?.map(vvv => {
                      const task = taskTemplates.find(t => t.id === vvv.taskId)

                      return <ListGroupItem key={vvv.id}>
                        {v.completionDate ? <div className='price-tag text-center'>$ {vvv.quotedPrice?.toFixed(2)}</div> : <HoverPriceTag onRemove={() => removeTask(v.id, vvv.id)}>$ {vvv.quotedPrice?.toFixed(2)}</HoverPriceTag>}
                        <Row>
                          <Col xs={{span: 6, order: 1}} lg="2" className='fw-lighter'>{vvv.recordedDate}</Col>
                          <Col xs={{span: 12, order: 3}} lg="4" className='fw-semibold'><Foreman /> {task.workmanshipTask} ({task.component.subsystem} - {task.component.componentName})</Col>
                          <Col xs={{span: 12, order: 4}} lg="6"><NoteTaking /> {vvv.remarks}</Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {((!v.migratedHandWrittenSpareParts)
                    && (!v.sparePartUsages)
                    && v.completionDate) && 
                    <Button aria-label="load individual service" onClick={() => loadWorkshopService(v)} variant='outline-secondary'><i className="bi bi-three-dots"></i></Button>}
                    {v.sparePartsCount === 0 && v.workmanshipTasksCount === 0 && !v.migratedHandWrittenSpareParts && <ListGroup.Item>Refer to the notes (if there is something)</ListGroup.Item>}
                    </ListGroup>
                  </Col>
                </Row>
              </Container>
              </Card.Body>
            </Card>
        )
      }
      <ResponsivePagination activePage={activePage} setActivePage={setActivePage} 
          totalPages={totalPages} />
    </Container>
  );
}

export default ServiceListing;