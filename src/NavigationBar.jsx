import { Badge, ButtonGroup, Col, Container, Dropdown, Form, InputGroup, Nav, Navbar, NavDropdown, NavLink, Row, Toast, ToastContainer } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Foreman, Services, Suppliers, Tools, Truck } from "./Icons";

export default function NavigationBar({
    showToastBox, setShowToastBox, toastBoxMessage,
    searchOptions, selectedSearchOptions, filteredOrders, filteredServices,
    filterServices, searchByDate, setSearchByDate, clearFilterDate, filterByDate

}) {
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <Container fluid className="position-sticky top-0 z-3 shadow mt-2 px-3 rounded" style={{backgroundColor: 'var(--bs-body-bg)'}}>
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
                    <Nav.Item><Nav.Link eventKey="home" onClick={() => navigate("/")}><Services /> Services {selectedSearchOptions.length > 0 && <Badge pill>{filteredServices.length}</Badge>}</Nav.Link></Nav.Item>
                    <Dropdown.Toggle as={NavLink} ></Dropdown.Toggle>
                    <Dropdown.Menu>
                        <NavDropdown.Item eventKey={'task'} onClick={() => navigate("/workmanships")}><Foreman /> Workmanship</NavDropdown.Item>
                    </Dropdown.Menu>
                    </Dropdown>
                    { false && <Nav.Item><Nav.Link eventKey="home" onClick={() => navigate("/")}><Services /> Services {selectedSearchOptions.length > 0 && <Badge pill>{filteredServices.length}</Badge>}</Nav.Link></Nav.Item> }
                    <Nav.Item><Nav.Link eventKey="orders" onClick={() => navigate("/orders")}><Suppliers /> Suppliers {selectedSearchOptions.length > 0 && <Badge pill>{filteredOrders.length}</Badge>}</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="vehicles" onClick={() => navigate("/vehicles")}><Truck /> Trucks</Nav.Link></Nav.Item>
                    { process.env.NODE_ENV === 'development' && <Nav.Item><Nav.Link eventKey="spare-parts" onClick={() => navigate("/spare-parts")}><Tools /> Spare Parts</Nav.Link></Nav.Item> }
                </Nav>
                <Form className="d-flex ms-auto responsive-width">
                {!searchByDate &&
                    <InputGroup>
                        <InputGroup.Text><Truck /></InputGroup.Text>
                        <InputGroup.Text><Tools /></InputGroup.Text>
                            <Typeahead
                                allowNew
                                disabled={location.pathname === '/vehicles'}
                                newSelectionPrefix="Search for... "
                                id="search-multiple"
                                labelKey="name"
                                multiple
                                clearButton
                                onChange={filterServices}
                                options={searchOptions}
                                placeholder="Choose by vehicle(s) and/or spart part(s)"
                                selected={selectedSearchOptions}
                            />
                        <InputGroup.Text><Calendar role={location.pathname === '/vehicles'  ? '' : 'button'} onClick={location.pathname === '/vehicles' ? ()=>{} : () => setSearchByDate(true)} /></InputGroup.Text>
                    </InputGroup>
                }
                {searchByDate && 
                <InputGroup>
                    <InputGroup.Text>Choose a date</InputGroup.Text>
                    <InputGroup.Text><i className="bi bi-x-circle" role="button" onClick={clearFilterDate}></i></InputGroup.Text>
                    <Form.Control disabled={location.pathname === '/vehicles'} type='date' placeholder='Choose a date' onChange={(e) => filterByDate(e.target.value)}></Form.Control>
                </InputGroup>
                }
                </Form>
            </Navbar.Collapse>
            </Navbar>
        </Container>
    )
}