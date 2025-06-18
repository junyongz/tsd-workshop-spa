import { useEffect, useRef, useState } from 'react';
import { Badge, Button, ButtonGroup, Card, Col, Container, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import Pagination from 'react-bootstrap/Pagination';
import ServiceDialog from './services/ServiceDialog';
import getPaginationItems from './utils/getPaginationItems';
import HoverPilledBadge from './components/HoverPilledBadge';
import CompletionLabel from './components/CompletionLabel';
import { chunkArray } from './utils/arrayUtils';
import { clearState } from './autoRefreshWorker';
import OrderTooltip from './services/OrderTooltip';
import YearMonthView from './services/YearMonthView';
import TransactionTypes from './components/TransactionTypes';
import { Calendar, Foreman, NoteTaking, Tools } from './Icons';
import ServiceNoteTakingDialog from './services/ServiceNoteTakingDialog';
import ServiceMediaDialog from './services/ServiceMediaDialog';

function ServiceListing({services, filteredServices=[], setFilteredServices,
    keywordSearch = () => {}, refreshSparePartUsages=() => {}, 
    refreshSpareParts=() => {},
    vehicles, setVehicles, spareParts, sparePartUsages=[],
    orders=[], suppliers=[], taskTemplates=[],
    onNewVehicleCreated=() => {}, setLoading=()=>{},
    selectedSearchOptions, onNewServiceCreated, removeTask}) {

  const apiUrl = process.env.REACT_APP_API_URL
  const [showModal, setShowModal] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const serviceTransaction = useRef()

  const [activePage, setActivePage] = useState(1)
  const chunkedItems = chunkArray(filteredServices, 10)
  const totalPages = chunkedItems.length;

  const [yearMonthView, setYearMonthView] = useState(false)

  const viewByYearMonth = () => {
    setYearMonthView(true)
  }

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
          throw Error("seems nothing deleted")
        }
        services.current.removeTransaction(serviceId, sparePartUsageId)
        keywordSearch()
      })
      .then(() => Promise.all([refreshSpareParts(), refreshSparePartUsages()]))
      .then(() => clearState())
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
        services.current.updateTransaction(newService)
        keywordSearch()
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
        services.current.updateForNote(newService)
        keywordSearch()
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
          throw new Error("uploaded media failed")
        }
        afterSaveMedia && afterSaveMedia(mediaId)
      })
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
        services.current.removeService(ws)
        keywordSearch()
      })
      .then(() => clearState())
      .then(() => refreshSparePartUsages())
      .finally(() => setLoading(false))
    })
  }

  const loadWorkshopService = (ws) => {
    fetch(`${apiUrl}/api/workshop-services/${ws.id}`)
    .then(resp => resp.json())
    .then(wsJson => {
      services.current.updateTransaction(wsJson)
      keywordSearch()
    })
  }

  useEffect(() => {
    if (selectedSearchOptions && selectedSearchOptions.length > 0) {
      setActivePage(1)
    }
  }, [selectedSearchOptions])

  return (
    <Container fluid>
    {
      yearMonthView && <YearMonthView services={services} setFilteredServices={setFilteredServices} suppliers={suppliers} orders={orders} taskTemplates={taskTemplates} backToService={() => setYearMonthView(false)}></YearMonthView>
    }
    { !yearMonthView && <Container fluid>
      <ServiceDialog isShow={showModal} setShow={setShowModal} trx={serviceTransaction} 
        onNewServiceCreated={onNewServiceCreated} 
        vehicles={vehicles} setVehicles={setVehicles} 
        spareParts={spareParts} taskTemplates={taskTemplates}
        orders={orders}
        suppliers={suppliers}
        sparePartUsages={sparePartUsages}
        onNewVehicleCreated={onNewVehicleCreated}></ServiceDialog>
      {serviceTransaction.current && <ServiceNoteTakingDialog isShow={showNote} setShowDialog={setShowNote} 
        ws={serviceTransaction.current} onSaveNote={onSaveNote}/> }
      {serviceTransaction.current && <ServiceMediaDialog isShow={showMedia} setShowDialog={setShowMedia} 
        ws={serviceTransaction.current} onSaveMedia={onSaveMedia}/> }
      <Row className='mb-3'>
        <Col>
          <Pagination className='d-flex d-lg-none fw-lighter'>
          { getPaginationItems(activePage, setActivePage, totalPages, 3) }
          </Pagination>
          <Pagination className='d-none d-lg-flex fw-lighter'>
          { getPaginationItems(activePage, setActivePage, totalPages, 10) }
          </Pagination>
        </Col>
        <Col className='text-end'>
          <ButtonGroup className='responsive-width-50'>
            <Button variant='secondary' onClick={() => viewByYearMonth()}><Calendar />&nbsp;Calendar View</Button>
            <Button variant='success' onClick={() => addNewServiceTransaction(new Date().toISOString().split('T')[0])}><i className="bi bi-plus-circle-fill me-2"></i>Add New</Button>
          </ButtonGroup>
        </Col>
      </Row>
      {
        chunkedItems[activePage - 1]?.map(v =>
            <Card key={v.id} className={'mb-3'}>
              <Card.Header>
                <Row>
                  <Col xs="12" lg="2"><h5>{v.vehicleNo}</h5></Col>
                  <Col xs="12" lg={{span: 12, order: 5}}><h5 className="text-body-secondary">started since {v.startDate}</h5></Col>
                  <Col xs="4" lg="8" className='mb-2'><TransactionTypes service={v} /></Col>
                  <Col xs="8" lg="2" className='text-end'>
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
                  { false && <Col className={'text-end col-4'}><Badge pill><i className="bi bi-person-fill-gear me-1"></i>{'Tan Chwee Seng'}</Badge></Col> }
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
                        <Row>
                          <Col xs="4" lg="2">{vvv.creationDate}</Col>
                          <Col xs="8" lg="6">{vvv.itemDescription}</Col>
                          <Col xs="6" lg="2" className='text-lg-end'><Badge pill>{vvv.quantity > 0 && vvv.unitPrice && `${vvv.quantity} ${vvv.unit} @ $${vvv.unitPrice?.toFixed(2)}`}</Badge></Col>
                          <Col xs="6" lg="2" className='text-end'><Badge pill>$ {vvv.totalPrice}</Badge></Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {v.sparePartUsages?.map(vvv => {
                      const order = orders?.mapping[vvv.orderId] || {}
                      const supplier = suppliers.find(s => s.id === order.supplierId)
                      const totalPrice = (vvv.quantity * vvv.soldPrice).toFixed(2)

                      return <ListGroupItem key={vvv.id}>
                        <Row>
                          <Col xs={{span: 6, order: 1}} lg="2" className='fw-lighter'>{vvv.usageDate}</Col>
                          <Col xs={{span: 12, order: 3}} lg="6">{ order.itemCode && !order.partName.includes(order.itemCode) && <span className='fw-lighter text-secondary'>{order.itemCode}&nbsp;</span> }<span className='fw-semibold'>{order.partName}</span> <div><OrderTooltip order={order} supplier={supplier} /></div></Col>
                          <Col xs={{span: 12, order: 4}} lg="2" className='text-end'>
                            {vvv.quantity > 0 && vvv.soldPrice && `${vvv.quantity} ${order.unit} @ $${vvv.soldPrice?.toFixed(2)}`}
                            {vvv.margin > 0 && <div><span className="text-secondary fw-lighter">original: ${order.unitPrice?.toFixed(2)} <i className="bi bi-arrow-up"></i>{vvv.margin}%</span></div> }
                          </Col>
                          <Col xs={{span: 6, order: 2}} lg={{span: 2, order: 'last'}} className='text-end'>{v.completionDate ? <span className='fw-semibold fs-5'>$ {totalPrice}</span> : <HoverPilledBadge onRemove={() => removeTransaction(v.id, vvv.id)}>$ {totalPrice}</HoverPilledBadge> }</Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {v.tasks?.map(vvv => {
                      const task = taskTemplates.find(t => t.id === vvv.taskId)

                      return <ListGroupItem key={vvv.id}>
                        <Row>
                          <Col xs={{span: 6, order: 1}} lg="2" className='fw-lighter'>{vvv.recordedDate}</Col>
                          <Col xs={{span: 12, order: 3}} lg="5" className='fw-semibold'><Foreman /> {task.workmanshipTask} ({task.component.subsystem} - {task.component.componentName})</Col>
                          <Col xs={{span: 12, order: 4}} lg="3"><NoteTaking /> {vvv.remarks}</Col>
                          <Col xs={{span: 6, order: 2}} lg={{span: 2, order: 'last'}} className='text-end'>{v.completionDate ? <Badge pill>$ {vvv.quotedPrice?.toFixed(2)}</Badge> : <HoverPilledBadge onRemove={() => removeTask(v.id, vvv.id)}>$ {vvv.quotedPrice?.toFixed(2)}</HoverPilledBadge> }</Col>                        
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {((!v.migratedHandWrittenSpareParts)
                    && (!v.sparePartUsages)
                    && v.completionDate) && 
                    <Button onClick={() => loadWorkshopService(v)} variant='outline-secondary'><i className="bi bi-three-dots"></i></Button>}
                    {v.sparePartsCount === 0 && v.workmanshipTasksCount === 0 && !v.migratedHandWrittenSpareParts && <ListGroup.Item>Refer to the notes (if there is something)</ListGroup.Item>}
                    </ListGroup>
                  </Col>
                </Row>
              </Container>
              </Card.Body>
            </Card>
           
        )
      }
      <Pagination className='d-flex d-lg-none fw-lighter'>
      { getPaginationItems(activePage, setActivePage, totalPages, 3) }
      </Pagination>
      <Pagination className='d-none d-lg-flex fw-lighter'>
      { getPaginationItems(activePage, setActivePage, totalPages, 10) }
      </Pagination>
    </Container> }
    </Container>
  );
}

export default ServiceListing;