import { Badge, Container, Form, InputGroup, Nav, Navbar, Row, Toast, ToastContainer } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { NavLink, useLocation } from "react-router-dom";
import { Calendar, Services, Suppliers, Tools, Truck } from "./Icons";

export default function NavigationBar({
    showToastBox, setShowToastBox, toastBoxMessage,
    searchOptions, selectedSearchOptions, filteredOrders, filteredServices,
    filterServices, searchByDate, setSearchByDate, clearFilterDate, filterByDate

}) {
    const location = useLocation()

    return (
        <Navbar expand="lg">
        <Container>
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
            <Navbar.Brand href="/"><span className="bg-success text-white rounded-3 py-2 px-4 fw-bold">TSD</span></Navbar.Brand>
            <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <Nav.Item className="me-2"><NavLink className={'btn btn-outline-primary'} to="/"><Services /> Services {selectedSearchOptions.length > 0 && <Badge pill>{filteredServices.length}</Badge>}</NavLink></Nav.Item>
                <Nav.Item className="me-2"><NavLink className={'btn btn-outline-primary'} to="/orders"><Suppliers /> Suppliers {selectedSearchOptions.length > 0 && <Badge pill>{filteredOrders.length}</Badge>}</NavLink></Nav.Item>
                <Nav.Item className="me-2"><NavLink className={'btn btn-outline-primary'} to="/vehicles"><Truck /> Trucks</NavLink></Nav.Item>
            </Nav>
            </Navbar.Collapse>
            <Form className="d-flex">
                {!searchByDate &&
                    <Form.Group>
                    <InputGroup>
                        <InputGroup.Text className="d-none d-lg-inline"><Truck /></InputGroup.Text>
                        <InputGroup.Text className="d-none d-lg-inline"><Tools /></InputGroup.Text>
                            <Typeahead
                                allowNew
                                disabled={location.pathname === '/vehicles'}
                                newSelectionPrefix="Search for... "
                                id="search-multiple"
                                labelKey="name"
                                multiple
                                onFocus={(evt) => evt.target.setAttribute('size', 70)}
                                onBlur={(evt) => evt.target.setAttribute('size', 20)}
                                onChange={filterServices}
                                options={searchOptions}
                                placeholder="Choose by vehicle(s) and/or spart part(s)"
                                selected={selectedSearchOptions}
                            />
                        <InputGroup.Text><Calendar role={location.pathname === '/vehicles'  ? '' : 'button'} onClick={location.pathname === '/vehicles' ? ()=>{} : () => setSearchByDate(true)} /></InputGroup.Text>
                    </InputGroup>
                    </Form.Group>
                }
                {searchByDate && 
                <Form.Group>
                <InputGroup>
                    <InputGroup.Text>Choose a date</InputGroup.Text>
                    <InputGroup.Text><i className="bi bi-x-circle" role="button" onClick={clearFilterDate}></i></InputGroup.Text>
                    <Form.Control disabled={location.pathname === '/vehicles'} type='date' placeholder='Choose a date' onChange={(e) => filterByDate(e.target.value)}></Form.Control>
                </InputGroup>
                </Form.Group>
                }
                </Form>
                <Navbar.Toggle className="ms-1" aria-controls="basic-navbar-nav" />
        </Container>
        </Navbar>
    )
}