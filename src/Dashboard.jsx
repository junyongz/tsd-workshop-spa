import { Card, Col, Container, FloatingLabel, Form, InputGroup, Row } from "react-bootstrap";
import { addDaysToDateStr } from "./utils/dateUtils";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { flattenForWeeklyByCompanyName, flattenNameForWeekly } from "./dashboard/reducer";
import { Calendar, Company } from "./Icons";

const apiUrl = process.env.REACT_APP_API_URL

export default function Dashboard() {

    const todayDate = new Date()
    const [fromDate, setFromDate] = useState(addDaysToDateStr(todayDate, -30))
    const [toDate, setToDate] = useState(addDaysToDateStr(todayDate, 0))
    const [chartWidth, setChartWidth] = useState(680)

    const [availableCompanies, setAvailableCompanies] = useState([])
    const [companyName, setCompanyName] = useState('All')

    const changeCompanyName = (chosenCompanyName) => {
        setCompanyName(chosenCompanyName)
        if (chosenCompanyName !== 'All') {
            setTransactionStats(flattenNameForWeekly(originalStats.filter(stat => stat.company_name === chosenCompanyName)))
        }
        else {
            setTransactionStats(flattenNameForWeekly(originalStats))
        }
    }

    const [originalStats, setOriginalStats] = useState([])
    const [transactionStats, setTransactionStats] = useState([]) 
    const [companyStats, setCompanyStats] = useState([]) 

    useEffect(() => {
        if (fromDate && toDate) {
            fetch(`${apiUrl}/api/transaction-stats?fromDate=${fromDate}&toDate=${toDate}`)
            .then(resp => resp.json())
            .then(stats => {
                setAvailableCompanies(Array.from(new Set(stats.map(stat => stat.company_name).filter(name => !!name))))
                setOriginalStats(stats)
                setTransactionStats(flattenNameForWeekly(companyName === 'All' ? stats : stats.filter(stat => stat.company_name === companyName)))
                setCompanyStats(flattenForWeeklyByCompanyName(stats))
            })
        }

        const settingResponsivePageNum = () => {
            if (window.matchMedia('(min-width: 1200px)').matches) {
                setChartWidth(680)
            }
            else if (window.matchMedia('(min-width: 992px)').matches) {
                setChartWidth(960)
            }
            else {
                setChartWidth(380)
            }
        }
        settingResponsivePageNum()
        window.addEventListener('resize', settingResponsivePageNum)

        return () => window.removeEventListener('resize', settingResponsivePageNum)
    }, [fromDate, toDate])

    return (
        <Container fluid>
            <Row className="mb-3">
                <Col xs="12" lg="12" xl="4" className="mb-1 mb-xl-0">
                    <InputGroup>
                        <InputGroup.Text><Company /></InputGroup.Text>
                        <FloatingLabel label="Choose a company">
                        <Form.Select aria-label="change company to" onChange={(e) => changeCompanyName(e.target.value)}>
                            <option value="All">All</option>
                            { availableCompanies.map(co => <option key={co} value={co}>{co}</option>) }
                        </Form.Select>
                        </FloatingLabel>
                    </InputGroup>
                </Col>
                <Col xs="12" lg="6" xl="4" className="mb-1 mb-xl-0">
                    <InputGroup>
                        <FloatingLabel label="From Date">
                        <Form.Control aria-label="change from date" type="date" name="fromDate" max={toDate} onChange={(e) => setFromDate(e.target.value)} value={fromDate} ></Form.Control>
                        </FloatingLabel>
                    </InputGroup>
                </Col>
                <Col xs="12" lg="6" xl="4" className="mb-1 mb-xl-0">
                    <InputGroup>
                        <FloatingLabel label="To Date">
                        <Form.Control aria-label="change to date" type="date" name="toDate" min={fromDate} max={addDaysToDateStr(todayDate, 0)} onChange={(e) => setToDate(e.target.value)} value={toDate} ></Form.Control>
                        </FloatingLabel>
                        <InputGroup.Text><div role="button" title="Today's date" aria-label="for today date" onClick={() => setToDate(addDaysToDateStr(todayDate, 0))}><Calendar /></div></InputGroup.Text>
                    </InputGroup>
                </Col>
            </Row>
            <Row>
                <Col xs="12" xl="6" className="mb-3">
                    <Card>
                        <Card.Header>Weekly Services (by type)</Card.Header>
                        <Card.Body>
                            <LineChart key={'s' + fromDate + ' ' + toDate} width={chartWidth} height={300} data={transactionStats} margin={{left: 10}}>
                                <CartesianGrid stroke="#aaa" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="count" stroke="orange" strokeWidth={5} name="Total" />
                                <Line type="monotone" dataKey="repair_count" stroke="indianred" strokeWidth={1} name="Repair" />
                                <Line type="monotone" dataKey="service_count" stroke="green" strokeWidth={1} name="Maintenance" />
                                <Line type="monotone" dataKey="inspection_count" stroke="steelblue" strokeWidth={1} name="Inspection" />
                                <Line type="monotone" dataKey="tyre_count" stroke="plum" strokeWidth={1} name="Tyre" />
                                <XAxis dataKey="week_start"/>
                                <YAxis label={{ value: 'Number of services', position: 'insideBottomLeft', angle: -90 }} />
                                <Legend />
                                <Tooltip />
                            </LineChart>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs="12" xl="6"  className="mb-3">
                    <Card>
                        <Card.Header>Spare Parts Cost</Card.Header>
                        <Card.Body>
                            <LineChart key={'p' + fromDate + ' ' + toDate} width={chartWidth} height={300} data={transactionStats} margin={{left: 10}}>
                                <CartesianGrid stroke="#aaa" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="part_costs" stroke="green" strokeWidth={2} name="Spare Part Costs" />
                                <XAxis dataKey="week_start" />
                                <YAxis label={{ value: 'RM $', position: 'insideBottomLeft', angle: -90 }} />
                                <Legend />
                                <Tooltip />
                            </LineChart>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs="12" xl="6"  className="mb-3">
                    <Card>
                        <Card.Header>Completed vs Ongoing</Card.Header>
                        <Card.Body>
                            <BarChart key={'pc' + fromDate + ' ' + toDate} width={chartWidth} height={300} data={transactionStats} margin={{left: 10}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week_start" />
                                <YAxis label={{ value: 'Number of services', position: 'insideBottomLeft', angle: -90 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="completion_count" fill="teal" name="Completed" />
                                <Bar dataKey="pending_count" fill="lightsalmon" name="Ongoing" />
                            </BarChart>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs="12" xl="6" className="mb-3">
                    <Card>
                        <Card.Header>Harsoon vs External</Card.Header>
                        <Card.Body>
                            <BarChart key={'he' + fromDate + ' ' + toDate} width={chartWidth} height={300} data={companyStats} margin={{left: 10}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week_start" />
                                <YAxis label={{ value: 'Number of services', position: 'insideBottomLeft', angle: -90 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="harsoon" fill="cornflowerblue" name="Harsoon Logistics" />
                                <Bar dataKey="external" fill="darkslategray" name="Customers" />
                            </BarChart>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}