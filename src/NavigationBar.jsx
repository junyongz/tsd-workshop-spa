import { Badge, ButtonGroup, Container, Dropdown, Form, InputGroup, Nav, Navbar, NavDropdown, NavLink, Row, Toast, ToastContainer } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Foreman, Services, Suppliers, Tools, Truck } from "./Icons";

export default function NavigationBar({
    showToastBox, setShowToastBox, toastBoxMessage,
    searchOptions, selectedSearchOptions, selectedSearchDate, setSelectedSearchDate, totalFilteredServices, totalFilteredOrders,
    filterServices, searchByDate, setSearchByDate, clearFilterDate, totalSpareParts
}) {
    
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <Container fluid className="position-sticky top-0 shadow mt-2 px-3 rounded" style={{backgroundColor: 'var(--bs-body-bg)', zIndex: 4}}>
            <Row>
                <ToastContainer className="p-3" position={'top-left'} style={{ zIndex: 3 }}>
                    <Toast bg="warning" show={showToastBox} onClose={() => setShowToastBox(false)}>
                    <Toast.Header>
                        <strong className="me-auto">Warning</strong>
                    </Toast.Header>
                    <Toast.Body>{toastBoxMessage}</Toast.Body>
                    </Toast>
                </ToastContainer>
            </Row>
            <Navbar expand="lg" className="mb-3">
            <Navbar.Brand href="/"><span className="fw-bold fs-1"><Truck /> TSD</span></Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse>
                <Nav variant="underline" defaultActiveKey={location.pathname === '/' ? 'home' : location.pathname.substring(1)}>
                    <Dropdown as={ButtonGroup}>
                    <Nav.Item><Nav.Link eventKey="home" aria-label="Home" onClick={() => navigate("/")}><Services /> {!((selectedSearchOptions?.length > 0 || selectedSearchDate) && totalFilteredServices > 0) && <span>Services</span> } {(selectedSearchOptions?.length > 0 || selectedSearchDate) && totalFilteredServices > 0 && <Badge pill>{totalFilteredServices}</Badge>}</Nav.Link></Nav.Item>
                    <Dropdown.Toggle aria-label="more for services" as={NavLink} ></Dropdown.Toggle>
                    <Dropdown.Menu>
                        <NavDropdown.Item eventKey={'task'} aria-label="Tasks" onClick={() => navigate("/workmanships")}><Foreman /> Workmanship</NavDropdown.Item>
                    </Dropdown.Menu>
                    </Dropdown>
                    <Nav.Item><Nav.Link eventKey="schedules" aria-label="Schedules" onClick={() => navigate("/schedules")}><Calendar /> Schedules</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="orders" aria-label="Suppliers" onClick={() => navigate("/orders")}><Suppliers /> {!((selectedSearchOptions?.length > 0 || selectedSearchDate) && totalFilteredOrders > 0) && <span>Suppliers</span>} {(selectedSearchOptions?.length > 0 || selectedSearchDate) && totalFilteredOrders > 0 && <Badge pill>{totalFilteredOrders}</Badge>}</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="vehicles" aria-label="Vehicles" onClick={() => navigate("/vehicles")}><Truck /> Trucks</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="spare-parts" aria-label="Parts" onClick={() => navigate("/spare-parts")}><Tools /> Parts {selectedSearchOptions?.length > 0 && totalSpareParts > 0 && <Badge pill>{totalSpareParts}</Badge>}</Nav.Link></Nav.Item>
                </Nav>
                <Form className="d-flex ms-auto responsive-width-50">
                {!searchByDate &&
                    <InputGroup>
                        <InputGroup.Text><Truck /></InputGroup.Text>
                        <InputGroup.Text><Tools /></InputGroup.Text>
                            <Typeahead
                                allowNew
                                disabled={location.pathname === '/services-overview'}
                                newSelectionPrefix="Search for... "
                                id="search-multiple"
                                labelKey="name"
                                multiple
                                clearButton
                                onChange={filterServices}
                                options={searchOptions}
                                placeholder="Choose by vehicle(s) and/or spart part(s)"
                            />
                        <InputGroup.Text><Calendar role={location.pathname === '/vehicles'  ? '' : 'button'} aria-label="search by date" onClick={location.pathname === '/vehicles' ? ()=>{} : () => setSearchByDate(true)} /></InputGroup.Text>
                    </InputGroup>
                }
                {searchByDate && 
                <InputGroup>
                    <InputGroup.Text>Choose a date</InputGroup.Text>
                    <InputGroup.Text><i className="bi bi-x-circle" role="button" aria-label="clear date" onClick={clearFilterDate}></i></InputGroup.Text>
                    <Form.Control disabled={location.pathname === '/vehicles'} type='date' placeholder='Choose a date' onChange={(e) => setSelectedSearchDate(e.target.value)}></Form.Control>
                </InputGroup>
                }
                </Form>
            </Navbar.Collapse>
            </Navbar>
        </Container>
    )
}