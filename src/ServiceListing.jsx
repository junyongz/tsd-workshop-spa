import React, { useEffect, useRef, useState } from 'react';
import { Badge, Button, ButtonGroup, Card, Col, Container, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import Pagination from 'react-bootstrap/Pagination';
import ServiceDialog from './ServiceDialog';
import getPaginationItems from './utils/getPaginationItems';
import HoverPilledBadge from './components/HoverPilledBadge';
import CompletionLabel from './components/CompletionLabel';
import { chunkArray } from './utils/arrayUtils';
import { clearState } from './autoRefreshWorker';
import OrderTooltip from './services/OrderTooltip';
import YearMonthView from './services/YearMonthView';
import TransactionTypes from './components/TransactionTypes';
import { Calendar } from './Icons';
import ServiceNoteTakingDialog from './services/ServiceNoteTakingDialog';
import ServiceMediaDialog from './services/ServiceMediaDialog';

function ServiceListing({services, filteredServices=[], setFilteredServices,
    keywordSearch = () => {}, refreshSparePartUsages=() => {}, 
    refreshSpareParts=() => {},
    vehicles, setVehicles, spareParts, sparePartUsages=[],
    orders=[], suppliers=[],
    onNewVehicleCreated=() => {}, setLoading=()=>{},
    selectedSearchOptions}) {

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
      items: [{ partName: 'Engine Oil 20w-50' }]
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

  // { id: ?, creationDate: ?, sparePartUsages: [{}, {} ]}
  const onNewServiceCreated = (service) => {
    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/workshop-services`, {
        method: 'POST', 
        body: JSON.stringify(service), 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => {
        if (!res.ok) {
          console.trace("Issue with POST workshop-services: " + JSON.stringify(res.body))
          throw Error("not good")
        }
        return res.json()
      })
      .then(service => {
        services.current.addNewTransaction(service)
        keywordSearch()
      })
      .then(() => Promise.all([refreshSpareParts(), refreshSparePartUsages()]))
      .then(() => clearState())
      .finally(() => setLoading(false))
    })
    
  }

  const removeTransaction = (serviceId, sparePartUsageId) => {
    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/spare-part-utilizations/${sparePartUsageId}`, {
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
 
      fetch(`${apiUrl}/workshop-services?op=COMPLETE`, {
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
      fetch(`${apiUrl}/workshop-services?op=NOTE`, {
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
      formData.append("file", file)

      fetch(`${apiUrl}/workshop-services/${service.id}/medias`, {
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
      fetch(`${apiUrl}/workshop-services/${ws.id}`, {
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
    fetch(`${apiUrl}/workshop-services/${ws.id}`)
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
      yearMonthView && <YearMonthView services={services} setFilteredServices={setFilteredServices} suppliers={suppliers} orders={orders} backToService={() => setYearMonthView(false)}></YearMonthView>
    }
    { !yearMonthView && <Container fluid>
      <ServiceDialog isShow={showModal} setShow={setShowModal} trx={serviceTransaction} 
        onNewServiceCreated={onNewServiceCreated} 
        vehicles={vehicles} setVehicles={setVehicles} 
        spareParts={spareParts}
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
          <Pagination className='d-flex d-lg-none'>
          { getPaginationItems(activePage, setActivePage, totalPages, 3) }
          </Pagination>
          <Pagination className='d-none d-lg-flex'>
          { getPaginationItems(activePage, setActivePage, totalPages, 10) }
          </Pagination>
        </Col>
        <Col className={'text-end'}>
          <ButtonGroup>
            <Button variant='secondary' onClick={() => viewByYearMonth()}><Calendar />&nbsp;Calendar View</Button>
            <Button variant='success' onClick={() => addNewServiceTransaction(new Date().toISOString().split('T')[0])}><i className="bi bi-plus-circle-fill me-2"></i>Add New</Button>
          </ButtonGroup>
        </Col>
      </Row>
      {
        chunkedItems[activePage - 1]?.map((v, i) =>
            <Card key={v.id} className={'mb-3'}>
              <Card.Header>
                <Row>
                  <Col xs="12" lg="4"><h5>{v.vehicleNo} <span className="text-body-secondary">started since {v.startDate}</span></h5></Col>
                  <Col xs="4" lg="4" className='mb-2'><TransactionTypes service={v} /></Col>
                  <Col xs="8" lg="4" className='text-end'>
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
                  <Col xs="12" lg="4" className='text-lg-end'>
                    <h4>
                      $ {((v.migratedHandWrittenSpareParts?.reduce((acc, curr) => acc += curr.totalPrice, 0) || 0) + 
                          (v.sparePartUsages?.reduce((acc, curr) =>  acc + (curr.quantity * curr.soldPrice), 0) || 0)).toFixed(2)}
                    </h4>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
              <Container fluid>
                <Row className='mb-3'>
                  <Col></Col>
                  <Col sm="2" className={'text-end'}>
                  {
                  !v.completionDate && 
                    <Button size="sm" variant='secondary' onClick={() => addNewItemForVehicle(v)}>
                      <i className="bi bi-truck-front-fill"></i> <span className='d-none d-lg-inline'>Add Item</span></Button>
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
                          <Col xs="6" lg="2" className='text-end'><Badge pill>{vvv.quantity > 0 && vvv.unitPrice && `${vvv.quantity} ${vvv.unit} @ $${vvv.unitPrice?.toFixed(2)}`}</Badge></Col>
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
                          <Col xs="4" lg="2">{vvv.usageDate}</Col>
                          <Col xs="8" lg="6">{ order.itemCode && !order.partName.includes(order.itemCode) && <span className='text-secondary'>{order.itemCode}&nbsp;</span> }<span>{order.partName}</span> <div className="d-none d-lg-block"><OrderTooltip order={order} supplier={supplier} /></div></Col>
                          <Col xs="6" lg="2" className='text-lg-end'><Badge pill>{vvv.quantity > 0 && vvv.soldPrice && `${vvv.quantity} ${order.unit} @ $${vvv.soldPrice?.toFixed(2)}`}</Badge></Col>
                          <Col xs="6" lg="2" className='text-end'>{v.completionDate ? <Badge pill>$ {totalPrice}</Badge> : <HoverPilledBadge onRemove={() => removeTransaction(v.id, vvv.id)}>$ {totalPrice}</HoverPilledBadge> }</Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {((!v.migratedHandWrittenSpareParts || v.migratedHandWrittenSpareParts.length === 0)
                    && (!v.sparePartUsages || v.sparePartUsages.length === 0) && v.completionDate) && 
                    <Button onClick={() => loadWorkshopService(v)} variant='outline-secondary'><i className="bi bi-three-dots"></i></Button>}
                    </ListGroup>
                  </Col>
                </Row>
              </Container>
              </Card.Body>
            </Card>
           
        )
      }
      <Pagination className='d-flex d-lg-none'>
      { getPaginationItems(activePage, setActivePage, totalPages, 3) }
      </Pagination>
      <Pagination className='d-none d-lg-flex'>
      { getPaginationItems(activePage, setActivePage, totalPages, 10) }
      </Pagination>
    </Container> }
    </Container>
  );
}

export default ServiceListing;