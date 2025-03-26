import React, { useRef, useState } from 'react';
import { Badge, Button, Card, Col, Container, ListGroup, ListGroupItem, Row, Stack } from 'react-bootstrap';
import Pagination from 'react-bootstrap/Pagination';
import ServiceDialog from './ServiceDialog';
import getPaginationItems from './utils/getPaginationItems';
import HoverPilledBadge from './components/HoverPilledBadge';
import CompletionLabel from './components/CompletionLabel';
import { chunkArray } from './utils/arrayUtils';

/***
 * Date: {
 *  vehicle: [transactions]
 * }
 */
function ServiceListing({services=[], filteredServices=[], 
    keywordSearch = () => {}, refreshSparePartUsages=() => {}, 
    refreshSpareParts=() => {},
    vehicles, setVehicles, spareParts, sparePartUsages=[],
    orders=[], suppliers=[],
    onNewVehicleCreated=() => {}, setLoading=()=>{}}) {

  const apiUrl = process.env.REACT_APP_API_URL
  const [showModal, setShowModal] = useState(false)
  const serviceTransaction = useRef()

  const [activePage, setActivePage] = useState(1)
  const chunkedItems = chunkArray(filteredServices, 14)
  const totalPages = chunkedItems.length;

  const addNewServiceTransaction = (creationDate) => {
    serviceTransaction.current = {
      creationDate: creationDate,
      items: [{ partName: 'Engine Oil 20w-50' }]
    };
    setShowModal(true)
  }

  const addNewItemForVehicle = (creationDate, vehicleNo) => {
    serviceTransaction.current = {
      creationDate: creationDate,
      vehicleNo: vehicleNo,
      items: [{ partName: 'Engine Oil 20w-50' }]
    };
    setShowModal(true)
  }

  const onNewServiceCreated = (newTrx=[]) => {
    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/transactions`, {
        method: 'POST', 
        body: JSON.stringify(newTrx), 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(trxs => {
        services.current.addNewTransaction(trxs)
        keywordSearch()
      })
      .then(() => refreshSparePartUsages())
      .finally(() => setLoading(false))
    })
    
  }

  const removeTransaction = (index) => {
    setLoading(true)
    requestAnimationFrame(() => {
      fetch(`${apiUrl}/transactions/${index}`, {
        method: 'DELETE', 
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(count => {
        if (count !== 1) {
          throw Error("should have 1 record deleted")
        }
        services.current.removeTransaction(index)
        keywordSearch()
      })
      .then(() => Promise.all([refreshSpareParts(), refreshSparePartUsages()]))
      .finally(() => setLoading(false))
    })
  }

  const completeAllServices = (newTrxs) => {
    fetch(`${apiUrl}/transactions?op=COMPLETE`, {
      method: 'POST', 
      body: JSON.stringify(newTrxs), 
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(trxs => {
      services.current.updateTransaction(trxs)
      keywordSearch()
    })
  }

  return (
    <Container>
      <ServiceDialog isShow={showModal} setShow={setShowModal} trx={serviceTransaction} 
        onNewServiceCreated={onNewServiceCreated} 
        vehicles={vehicles} setVehicles={setVehicles} 
        spareParts={spareParts}
        orders={orders}
        suppliers={suppliers}
        sparePartUsages={sparePartUsages}
        onNewVehicleCreated={onNewVehicleCreated}></ServiceDialog>
      <Row>
        <Col>
          <Pagination>
          { getPaginationItems(activePage, setActivePage, totalPages, 10) }
          </Pagination>
        </Col>
        <Col className={'text-sm-end col-2'}>
          <Button variant='success' onClick={() => addNewServiceTransaction(new Date().toISOString().split('T')[0])}><i className="bi bi-plus-circle-fill me-2"></i>Add New</Button>
        </Col>
      </Row>

      {
        chunkedItems[activePage - 1]?.map((v, i) =>
          <div key={v.index} className={i % 2 === 0 ? 'rounded-2 p-3 mb-3 bg-body-secondary': 'rounded-2 p-3 mb-3 bg-light'}>
            <Row>
              <Col><h3 key={i}><i className="bi bi-calendar-event pe-1"></i>{v[0]}</h3></Col>
              <Col className={'text-sm-end'}><Button variant="dark" onClick={() => addNewServiceTransaction(v[0])}><i className="bi bi-calendar-event me-2"></i>Add Service</Button></Col>
            </Row>
          { Object.entries(v[1]).map((vv, ii) =>
            <Card key={ii} className={'mb-3'}>
              <Card.Header>
                <Row>
                  <Col><h5>{vv[0]}</h5> <CompletionLabel creationDate={v[0]} completionDate={vv[1][0].completionDate} onCompletion={() => completeAllServices(vv[1])}></CompletionLabel></Col>
                  { false && <Col className={'text-sm-end col-4'}><Badge pill><i className="bi bi-person-fill-gear me-1"></i>{'Tan Chwee Seng'}</Badge></Col> }
                  <Col sm="4" className={'text-sm-end'}>
                    <h4><span className="border border-1 border-primary border-opacity-50 rounded-2 px-3 py-1">$ {vv[1].reduce((prev, curr) => prev += curr.totalPrice, 0).toFixed(2)}</span></h4>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
              <Container fluid="md">
                <Row className='mb-3'>
                  <Col></Col>
                  <Col sm="2" className={'text-sm-end'}>
                  {(!vv[1][0].migratedIndicator || !vv[1][0].migratedIndicator == 'Y') && 
                    <Button size="sm" variant='secondary' onClick={() => addNewItemForVehicle(v[0], vv[0])}>
                      <i className="bi bi-truck-front-fill me-2"></i>Add Item</Button>
                    }
                  </Col>
                </Row>
                <Row>
                  <Col className="p-0">
                    <ListGroup>
                    {vv[1].map((vvv, iii) => 
                      <ListGroupItem key={vvv.index}>
                        <Stack direction="horizontal">
                          <Col>{vvv.itemDescription}</Col>
                          <Col className='text-sm-end col-2'><Badge pill>{vvv.quantity > 0 && vvv.unitPrice && `${vvv.quantity} ${vvv.unit} @ $${vvv.unitPrice?.toFixed(2)}`}</Badge></Col>
                          <Col className='text-sm-end col-2'>{vvv.migratedIndicator || vvv.completionDate ? <Badge pill>$ {vvv.totalPrice}</Badge> : <HoverPilledBadge onRemove={() => removeTransaction(vvv.index)}>$ {vvv.totalPrice}</HoverPilledBadge> }</Col>
                        </Stack>
                      </ListGroupItem>)
                    }
                    </ListGroup>
                  </Col>
                </Row>
              </Container>
              </Card.Body>
            </Card>
           ) } 
           </div>
        )
      }
      <Pagination>
        { getPaginationItems(activePage, setActivePage, totalPages, 10) }
      </Pagination>
    </Container>
  );
}

export default ServiceListing;