import { useRef } from "react";
import { Badge, Container, Form, InputGroup, Nav, Navbar, Row, Toast, ToastContainer } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { NavLink } from "react-router-dom";

export default function NavigationBar({
    showToastBox, setShowToastBox, toastBoxMessage,
    searchOptions, selectedSearchOptions, filteredOrders, filteredServices,
    filterServices, searchByDate, setSearchByDate, clearFilterDate, filterByDate

}) {
    const searchBoxRef = useRef();

    return (
        <Navbar expand="lg" className="justify-content-between">
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
            <Nav className="me-auto">
                <Nav.Item className="me-2"><NavLink className={'btn btn-outline-primary'} to="/"><i className="bi bi-wrench-adjustable"></i> Services {selectedSearchOptions.length > 0 && <Badge pill>{filteredServices.length}</Badge>}</NavLink></Nav.Item>
                <Nav.Item className="me-2"><NavLink className={'btn btn-outline-primary'} to="/orders"><i className="bi bi-shop"></i> Suppliers {selectedSearchOptions.length > 0 && <Badge pill>{filteredOrders.length}</Badge>}</NavLink></Nav.Item>
                <Nav.Item className="me-2"><NavLink className={'btn btn-outline-primary'} to="/vehicles"><i className="bi bi-truck"></i> Trucks</NavLink></Nav.Item>
                <Form className="d-flex">
                {!searchByDate &&
                    <Form.Group>
                    <InputGroup>
                        <InputGroup.Text><i className="bi bi-truck"></i></InputGroup.Text>
                        <InputGroup.Text><i className="bi bi-tools"></i></InputGroup.Text>
                            <Typeahead
                                allowNew
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
                        <InputGroup.Text><i className="bi bi-calendar-event" role="button" onClick={() => setSearchByDate(true)}></i></InputGroup.Text>
                    </InputGroup>
                    </Form.Group>
                }
                {searchByDate && 
                <Form.Group>
                <InputGroup>
                    <InputGroup.Text>Choose a date</InputGroup.Text>
                    <InputGroup.Text><i className="bi bi-x-circle" role="button" onClick={clearFilterDate}></i></InputGroup.Text>
                    <Form.Control type='date' placeholder='Choose a date' onChange={(e) => filterByDate(e.target.value)}></Form.Control>
                </InputGroup>
                </Form.Group>
                }
            </Form>
            </Nav>
        </Container>
        </Navbar>
    )
}