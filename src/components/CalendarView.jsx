import { ButtonGroup, Button, Container, Card, Badge, Col, Row, ListGroup, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { addDaysToDateStr, days3EngCharsStartWithSun, months3EngChars, sameDay } from "../utils/dateUtils";
import { useEffect, useState } from "react";
import './CalendarView.css'
import { HandPointer, Trash } from "../Icons";

export default function CalendarView({
    events=[{date: new Date(), display: 'JTN 1288', description: 'due for service'}], 
    onClickNew,
    onClickRemove
}) {
    const todayDate = new Date()
    const [choosenDate, setChoosenDate] = useState(todayDate)

    const [showEventsDialog, setShowEventDialog] = useState(false)

    const idealHeight = () => (document.body.clientHeight - 350) / 5
    const idealHeightBasedOnWidth = () => ((document.body.clientWidth - 100) / 7) - 20

    const calculateMinHeight = () => {
        return Math.min(idealHeight(), idealHeightBasedOnWidth())
    }

    const [month, setMonth] = useState(new Date().getMonth())
    const [maxHeight, setMaxHeight] = useState(calculateMinHeight())

    const requiredDate = new Date(todayDate.getFullYear(), month, 1)
    const firstDay = new Date(todayDate.getFullYear(), month, 1).getDay()
    const lastDay = new Date(todayDate.getFullYear(), month + 1, 0).getDate()

    const emptyDays = Array.from({ length: firstDay }, () => '');

    const totalDays = firstDay + lastDay; // Span of days
    const rowsRequired = Math.ceil((totalDays)/7)

    const onDateClicked = (clickedDate) => {
        setChoosenDate(clickedDate)
        if (window.matchMedia('(min-width: 992px)').matches) {
            onClickNew(clickedDate)
        }
    }

    const prepareToShowEventDialog = (e, boxDate) => {
        e.stopPropagation()
        setChoosenDate(boxDate)
        setShowEventDialog(true)
    }

    useEffect(() => {
       const settingMaxHeight = () => setMaxHeight(calculateMinHeight())
       settingMaxHeight()
       
       window.addEventListener("resize", settingMaxHeight)

       return () => {
            window.removeEventListener('resize', settingMaxHeight)
       }
    }, [])

    const AllEvents = ({events=[], onDoClickNew}) => {
        return (
            <ListGroup>
                <ListGroup.Item key={'add-new'} className="text-end"><Button aria-label="create new event" className="responsive-width-25" onClick={() => onDoClickNew()}>Add New</Button></ListGroup.Item>
                { choosenDate && events.filter(evt => sameDay(evt.date, choosenDate))
                    .map(evt => <ListGroup.Item key={evt.id}>
                        <Row>
                        <Col xs="10"><span className="fw-semibold">{ evt.display }</span></Col> 
                        { isFinite(evt.id) && <Col xs="2"><Button variant="danger" onClick={() => onClickRemove(evt.id) }><Trash /></Button></Col> }
                        <Col xs="12">{evt.description}</Col>
                        </Row>
                        </ListGroup.Item>) 
                }
                { (!choosenDate || events.filter(evt => sameDay(evt.date, choosenDate)).length === 0) && <ListGroup.Item key={'no-item'}>Nothing scheduled yet</ListGroup.Item>}
            </ListGroup>
        )
    }

    const EventDisplay = ({item={display: '', description: '', variant: 'primary'}}) => {
        return (
            <OverlayTrigger overlay={<Tooltip>{item.description}</Tooltip>}>
                <Badge bg={item.variant ?? 'primary'}>{item.display}</Badge>
            </OverlayTrigger>
        )
    }

    return (
        <Container fluid>
            <Row>
                <Modal show={showEventsDialog} onHide={() => setShowEventDialog(false)}>
                    <Modal.Header closeButton>
                        Schedules for {choosenDate ? addDaysToDateStr(choosenDate, 0) : ''}
                    </Modal.Header>
                    <Modal.Body>
                        <AllEvents events={events} onDoClickNew={() => { onClickNew(choosenDate); setShowEventDialog(false)}} />
                    </Modal.Body>
                </Modal>
            </Row>
            <Row>
            <Col xs='6'><h1><span className="fw-bold">{months3EngChars[requiredDate.getMonth()]}</span> <span className="fw-lighter">{requiredDate.getFullYear()}</span></h1></Col>
            <Col xs='6' className="text-end"><ButtonGroup>
                <Button aria-label="previous month" onClick={() => { setMonth(m => m-1); setChoosenDate() }}>&lt;</Button>
                <Button onClick={() => { setMonth(todayDate.getMonth()); setChoosenDate(todayDate) }}>Today</Button>
                <Button aria-label="next month" onClick={() => { setMonth(m => m+1); setChoosenDate() }}>&gt;</Button></ButtonGroup></Col>
            </Row>
            <div className="calendar-grid" style={{'--weeks': rowsRequired}}>
                {days3EngCharsStartWithSun.map((day) => (
                <div key={day}><h3>{day}</h3></div>
                ))}
                {emptyDays.map((_, i) => (
                <div key={`empty-${month}-${i}`}></div>
                ))}
                {Array.from({length: lastDay}, (_, i) => i + 1).map((date) => {
                    const boxDate = new Date(requiredDate.getFullYear(), requiredDate.getMonth(), date)
                    return ( <div className="calendar-day" key={`${month}-${date}`} 
                                role="button" aria-label={`day of ${month}-${date}`} onClick={() => onDateClicked(boxDate)}>
                        <Card>
                            <Card.Header className={sameDay(choosenDate || todayDate, boxDate) ? 'text-bg-primary' : ''}>{ date }</Card.Header>
                            <Card.Body style={{height: maxHeight, maxHeight: maxHeight, '--bs-card-spacer-y': '5px'}}>
                                <Row className="d-none d-lg-flex">
                                {
                                    events.filter(evt => sameDay(evt.date, boxDate))
                                    .slice(0, 3)
                                    .map(evt => <Col xs="12" key={evt.id} style={{whiteSpace: 'none'}}><EventDisplay item={evt} /></Col>)
                                }
                                </Row>
                                {events.filter(evt => sameDay(evt.date, boxDate)).length > 0 && <Row className="d-none d-lg-flex">
                                    <span className="text-secondary" role="button" onClick={(e) => prepareToShowEventDialog(e, boxDate)}><HandPointer /> more...</span>
                                </Row> }
                                <Row className="d-flex d-lg-none">
                                    { events.filter(evt => sameDay(evt.date, boxDate)).length > 0 && <Badge pill>{ events.filter(evt => sameDay(evt.date, boxDate)).length}</Badge> }
                                </Row>
                            </Card.Body>
                        </Card>
                    </div> ) }
                )}
            </div>
            <div className="d-block d-lg-none">
                <AllEvents events={events} onDoClickNew={() => onClickNew(choosenDate)} />
            </div>
        </Container>
    )
}