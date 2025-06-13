import { useRef, useState } from 'react';
import { Button, Card, Col, Container, Form, InputGroup, ListGroup, ListGroupItem, Modal, Nav, Row } from 'react-bootstrap';
import OrderTooltip from './OrderTooltip';
import { Calendar, Foreman, Tools } from '../Icons';
import TaskSubDialog from './TaskSubDialog';
import generateUniqueId from '../utils/randomUtils';
import TransactionTypes from '../components/TransactionTypes';
import { isInternal } from '../companies/companyEvaluation';

function InProgressTaskFocusListing({filteredServices=[],
    orders=[], suppliers=[], taskTemplates=[], onNewServiceCreated, removeTask, 
    vehicles=[], companies=[]}) {

  const [validated, setValidated] = useState(false)
  const formRef = useRef()
  const inProgressServices = filteredServices.filter(ws => !!!ws.completionDate)
                                .filter(ws => !isInternal(companies, vehicles, ws))

  const [spareParts, setSpareParts] = useState([])
  const [originalSpareParts, setOriginalSpareParts] = useState([])

  const [selectedSparePart, setSelectedSparePart] = useState()

  const [targetedService, setTargetedService] = useState()
  const [tasks, setTasks] = useState([])
  const [originalTasks, setOriginalTasks] = useState([])
  const showTaskSubDialog = (ws) => {
    setTargetedService(ws)
    const theTasks = [...ws.tasks].map(v => {
        return {...v, rid: generateUniqueId(), selectedTask: [taskTemplates.find(t => t.id === v.taskId)]}
    }).sort((t1, t2) => t1.id - t2.id)
    setTasks(theTasks)
    setOriginalTasks(theTasks)

    const theSpus = ws.sparePartUsages.map(spu => {
      return {...spu, order: orders.mapping[spu.orderId], margin: spu.margin || 0}
    })
    setSpareParts(theSpus)
    setOriginalSpareParts(theSpus)
  }

  const addNewTask = () => {
    setTasks(prev => [{rid: generateUniqueId()}, ...prev])
  }

  const showAllInProgressTasks = () => {
    setTargetedService()
    setTasks([])
  }

  const saveChange = () => {
    if (originalTasks === tasks && originalSpareParts === spareParts) {
      setTargetedService()
      const emptyArray = []
      setTasks(emptyArray)
      setOriginalTasks(emptyArray)
      setSpareParts(emptyArray)
      setOriginalSpareParts(emptyArray)
      return
    }
    const nativeForm = formRef.current

    if (nativeForm.checkValidity() === false) {
        setValidated(true)
        return
    }

    const service = {
        ...targetedService,
        sparePartUsages: [...spareParts],
        tasks: tasks.map(v => {
            return {
                ...v,
                recordedDate: targetedService.startDate,
                taskId: v.taskId,
                quotedPrice: v.quotedPrice,
                remarks: v.remarks
            }
        })
    }

    onNewServiceCreated(service)
    setValidated(false)
    showAllInProgressTasks()
  }

  const changeMargin = (margin) => {
    if (selectedSparePart) {
      setSpareParts(prev => {
        const newItems = [...prev].map(v => {
          if (v.id === selectedSparePart.id) {
            v.soldPrice = v.order.unitPrice * (1 + (margin/100))
            v.margin = margin
          }
          return v
        })
        return newItems
      })
      setSelectedSparePart({...selectedSparePart, soldPrice: selectedSparePart.order.unitPrice * (1 + (margin/100)), margin: margin})
      return
    }

    setTargetedService({...targetedService, sparePartsMargin: margin})
    setSpareParts(prev => {
      const newItems = [...prev].map(v => {
        v.soldPrice = v.order.unitPrice * (1 + (margin/100))
        v.margin = margin
        return v
      })
      return newItems
    })
  }

  const handleClose = () => {
    setSelectedSparePart()
  }

  return (
    <Container fluid className='fs-4'>
        {selectedSparePart && selectedSparePart.order && <Row>
          <Col>
          <Modal show onHide={handleClose} onEscapeKeyDown={(e) => e.preventDefault()} size="md">
            <Modal.Header>
            <Modal.Title>Margin for 1 Item</Modal.Title>
            </Modal.Header>
            <Modal.Body className='fs-4 text-center'>
              <div>{selectedSparePart.order.partName}</div>
              <div>{selectedSparePart.quantity} {selectedSparePart.order.unit} @ ${selectedSparePart.soldPrice?.toFixed(2)} </div>
              <div className="text-secondary">original: ${selectedSparePart.order.unitPrice?.toFixed(2)} </div>
              <Nav className='justify-content-center' variant='pills' activeKey={selectedSparePart.margin} onSelect={(v) => changeMargin(v)}>
                {[20, 30, 40].map(v => 
                <Nav.Item><Nav.Link eventKey={v}>{v}%</Nav.Link></Nav.Item>)}
                <Nav.Item className='ms-3'><InputGroup>
                  <Form.Control onChange={(e) => changeMargin(parseFloat(e.target.value))} 
                  style={{width: '6rem'}} required min="0" max="300" size="lg" 
                  type="number" step={10} name="sparePartsMargin" value={selectedSparePart.margin}/><InputGroup.Text>%</InputGroup.Text>
                  </InputGroup></Nav.Item>
              </Nav>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={handleClose}><i className="bi bi-save2 me-2"></i> OK</Button>
            </Modal.Footer>
          </Modal>
          </Col>
        </Row> }
        <Row className='a'>
        {
        !targetedService && inProgressServices.map((v, i) =>
            <Col xs="12" md="6" lg="4">
            <Card key={v.id} className={'mb-3'} onClick={() => showTaskSubDialog(v, i)} role="button">
              <Card.Header>
                <Row>
                  <Col xs="6"><h1>{v.vehicleNo}</h1></Col>
                  <Col xs="6" className='align-content-center text-end'>
                  {v.mileageKm > 0 && <h4><span className="text-body-secondary">{v.mileageKm} KM</span></h4> }
                  </Col>
                </Row>
                <Row>
                  <Col xs="12"><TransactionTypes service={v} /></Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <Row>
                <Col xs="12"><h4><span className="text-body-secondary">started since {v.startDate}</span></h4></Col>
                <Col xs="6">
                <h4>
                    $ {((v.migratedHandWrittenSpareParts?.reduce((acc, curr) => acc += curr.totalPrice, 0) || 0) + 
                        (v.sparePartUsages?.reduce((acc, curr) =>  acc + (curr.quantity * curr.soldPrice), 0) || 0) +
                        (v.tasks?.reduce((acc, curr) => acc + (curr.quotedPrice || 0), 0) || 0)).toFixed(2)}
                </h4>
                </Col>
                <Col xs="6" className='text-end'><Tools /> {v.sparePartsCount} <Foreman /> {v.workmanshipTasksCount}</Col>
                </Row>
              </Card.Body>
            </Card>
            </Col>           
        )
        }
        </Row>
        <Row>
            {targetedService && 
            <Container>
                <div className='position-sticky top-0' style={{zIndex: 6}}>
                <Row className='mb-1'>
                    { false && <Col xs="6">
                    <Button className='w-100' variant='outline-warning' size='lg' 
                        onClick={() => showAllInProgressTasks()}><i className="bi bi-arrow-left-circle-fill"></i> Go Back</Button>
                    </Col> }
                    <Col xs="12">
                    <Button className='w-100' variant='success' size='lg' 
                        onClick={() => saveChange()}><i className="bi bi-arrow-left-circle-fill"></i> OKAY</Button>
                    </Col>
                </Row>
                <Row className='mb-3 bg-body-secondary rounded'>
                  <Col xs="12" className='text-center'><h1>{targetedService.vehicleNo}</h1></Col>
                  <Col xs="12" lg="4" className='text-lg-start text-center'><h4><span className="text-body-secondary">Started since {targetedService.startDate}</span></h4></Col>
                  <Col xs="12" lg="4" className='text-center'>
                    <h4>
                      $ {((targetedService.migratedHandWrittenSpareParts?.reduce((acc, curr) => acc += curr.totalPrice, 0) || 0) + 
                          (spareParts?.reduce((acc, curr) =>  acc + (curr.quantity * curr.soldPrice), 0) || 0) +
                          (tasks?.reduce((acc, curr) => acc + curr.quotedPrice, 0) || 0)).toFixed(2)}
                    </h4>
                  </Col>
                  <Col xs="12" lg="4" className='text-center text-lg-end'>
                  <h4><span className="text-body-secondary">{targetedService.mileageKm || '-'} KM</span></h4>
                  </Col>
                </Row>
                </div>
                <Row className='mb-3'>
                    <Col>
                    <Card>
                    <Card.Header><Foreman /> Workmanship</Card.Header>
                    <Card.Body>
                    <Button className='w-100 mb-1' variant='primary' size='lg' 
                        onClick={() => addNewTask()}><i className="bi bi-plus-circle-fill"></i> Add New</Button>
                        <Form ref={formRef} validated={validated}>
                        <TaskSubDialog taskTemplates={taskTemplates} tasks={tasks} setTasks={setTasks} removeTask={removeTask}></TaskSubDialog>
                        </Form>
                    </Card.Body>
                    </Card>
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <Card>
                        <Card.Header>
                          <Row>
                          <Col xs="12" lg="6"><Tools /> Spare Parts</Col>
                          <Col xs="12" lg="6" className='text-end'>
                            {spareParts.length > 0 && <Nav className='justify-content-end' variant='pills' activeKey={targetedService.sparePartsMargin} onSelect={(v) => changeMargin(v)}>
                              {[20, 30, 40].map(v => 
                              <Nav.Item><Nav.Link eventKey={v}>{v}%</Nav.Link></Nav.Item>)}
                              <Nav.Item className='ms-2'><InputGroup><Form.Control onChange={(e) => changeMargin(parseFloat(e.target.value))} style={{width: '6rem'}} required min="0" max="300" size="lg" type="number" step={10} name="sparePartsMargin" value={targetedService.sparePartsMargin} /><InputGroup.Text>%</InputGroup.Text></InputGroup></Nav.Item>
                            </Nav> }
                          </Col>
                          </Row>
                        </Card.Header>
                        <Card.Body>
                        <ListGroup>
                  {spareParts?.map(vvv => {
                      const order = vvv.order
                      const supplier = suppliers.find(s => s.id === order.supplierId)
                      const totalPrice = (vvv.quantity * vvv.soldPrice).toFixed(2)

                      return <ListGroupItem key={vvv.id} onClick={() => setSelectedSparePart(vvv)} role='button'>
                        <Row>
                          <Col xs="12" lg="2" className='fw-lighter'><Calendar /> {vvv.usageDate}</Col>
                          <Col xs="12" lg="4" className='fw-semibold'>{ order.itemCode && !order.partName.includes(order.itemCode) && <span className='text-secondary'>{order.itemCode}&nbsp;</span> }<span>{order.partName}</span> <div className="d-none d-lg-block"><OrderTooltip order={order} supplier={supplier} /></div></Col>
                          <Col xs="6" lg="4" className='text-lg-end'>
                          {vvv.quantity > 0 && vvv.soldPrice && `${vvv.quantity} ${order.unit} @ $${vvv.soldPrice?.toFixed(2)}`} 
                          <div><span className="text-secondary">original: ${order.unitPrice?.toFixed(2)} {vvv.margin > 0 && <><i className="bi bi-arrow-up"></i>{vvv.margin}%</>}</span></div>  
                          </Col>
                          <Col xs="6" lg="2" className='text-end fw-semibold'>$ {totalPrice}</Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {spareParts.length === 0 && <ListGroupItem>Nothing added yet</ListGroupItem>}
                    </ListGroup>
                    </Card.Body>
                    </Card>
                    </Col>
                </Row>
            </Container>}
        </Row>
    </Container>
  );
}

export default InProgressTaskFocusListing;