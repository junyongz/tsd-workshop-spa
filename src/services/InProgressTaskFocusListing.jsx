import { useRef, useState } from 'react';
import { Button, Card, Col, Container, Form, ListGroup, ListGroupItem, Row } from 'react-bootstrap';
import OrderTooltip from './OrderTooltip';
import { Foreman, Tools } from '../Icons';
import TaskSubDialog from './TaskSubDialog';
import generateUniqueId from '../utils/randomUtils';
import TransactionTypes from '../components/TransactionTypes';

function InProgressTaskFocusListing({filteredServices=[],
    orders=[], suppliers=[], taskTemplates=[], onNewServiceCreated, removeTask}) {

  const [validated, setValidated] = useState(false)
  const formRef = useRef()
  const inProgressServices = filteredServices.filter(ws => !!!ws.completionDate)

  const [targetedService, setTargetedService] = useState()
  const [tasks, setTasks] = useState([])
  const [originalTasks, setOriginalTasks] = useState([])
  const showTaskSubDialog = (ws, i) => {
    setTargetedService(ws)
    const theTasks = [...ws.tasks].map(v => {
        return {...v, rid: generateUniqueId(), selectedTask: [taskTemplates.find(t => t.id === v.taskId)]}
    }).sort((t1, t2) => t1.id - t2.id)
    setTasks(theTasks)
    setOriginalTasks(theTasks)
  }

  const addNewTask = () => {
    setTasks(prev => [{rid: generateUniqueId()}, ...prev])
  }

  const showAllInProgressTasks = () => {
    setTargetedService()
    setTasks([])
  }

  const saveChange = () => {
    if (originalTasks === tasks) {
      setTargetedService()
      const emptyArray = []
      setTasks(emptyArray)
      setOriginalTasks(emptyArray)
      return
    }
    const nativeForm = formRef.current

    if (nativeForm.checkValidity() === false) {
        setValidated(true)
        return
    }

    const service = {
        ...targetedService,
        sparePartUsages: [],
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

  return (
    <Container fluid className='fs-4'>
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
                <Col xs="12" lg="6">
                <h4>
                    $ {((v.migratedHandWrittenSpareParts?.reduce((acc, curr) => acc += curr.totalPrice, 0) || 0) + 
                        (v.sparePartUsages?.reduce((acc, curr) =>  acc + (curr.quantity * curr.soldPrice), 0) || 0) +
                        (v.tasks?.reduce((acc, curr) => acc += curr.quotedPrice, 0) || 0)).toFixed(2)}
                </h4>
                </Col>
                <Col xs="12" lg="6" className='text-lg-end'><Tools /> {v.sparePartsCount} <Foreman /> {v.workmanshipTasksCount}</Col>
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
                <Row className='mb-3 position-sticky top-0' style={{zIndex: 6}}>
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
                          (targetedService.sparePartUsages?.reduce((acc, curr) =>  acc + (curr.quantity * curr.soldPrice), 0) || 0) +
                          (targetedService.tasks?.reduce((acc, curr) => acc += curr.quotedPrice, 0) || 0)).toFixed(2)}
                    </h4>
                  </Col>
                  <Col xs="12" lg="4" className='text-center text-lg-end'>
                  <h4><span className="text-body-secondary">{targetedService.mileageKm || '-'} KM</span></h4>
                  </Col>
                </Row>
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
                        <Card.Header><Tools /> Spare Parts</Card.Header>
                        <Card.Body>
                        <ListGroup>
                {targetedService.sparePartUsages?.map(vvv => {
                      const order = orders?.mapping[vvv.orderId] || {}
                      const supplier = suppliers.find(s => s.id === order.supplierId)
                      const totalPrice = (vvv.quantity * vvv.soldPrice).toFixed(2)

                      return <ListGroupItem key={vvv.id}>
                        <Row>
                          <Col xs="4" lg="2">{vvv.usageDate}</Col>
                          <Col xs="8" lg="6">{ order.itemCode && !order.partName.includes(order.itemCode) && <span className='text-secondary'>{order.itemCode}&nbsp;</span> }<span>{order.partName}</span> <div className="d-none d-lg-block"><OrderTooltip order={order} supplier={supplier} /></div></Col>
                          <Col xs="6" lg="2" className='text-lg-end'>{vvv.quantity > 0 && vvv.soldPrice && `${vvv.quantity} ${order.unit} @ $${vvv.soldPrice?.toFixed(2)}`}</Col>
                          <Col xs="6" lg="2" className='text-end'>$ {totalPrice}</Col>
                        </Row>
                      </ListGroupItem>
                      })
                    }
                    {targetedService.sparePartUsages.length === 0 && <ListGroupItem>Nothing added yet</ListGroupItem>}
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