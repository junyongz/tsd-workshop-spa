import { useEffect, useState } from "react";
import { Dollar, Foreman, NoteTaking, Trash } from "../Icons";
import { Button, Col, Dropdown, Form, Image, InputGroup, ListGroup, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

let searchTimer

/**
 * 
 * @param {Object} props
 * @param {import("../ServiceTransactions").TaskTemplate[]} props.taskTemplates
 * @param {import("../ServiceTransactions").WorkmashipTask[]} props.tasks
 * @param {React.SetStateAction<import("../ServiceTransactions").WorkmashipTask[]>} props.setTasks
 * @param {Function} props.removeTask
 * @returns 
 */
export default function TaskSubDialog({taskTemplates, tasks, setTasks, removeTask}) {
    const afterChooseTask = ([task], i) => {
        setTasks(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...prevs[i], taskId: task?.id, quotedPrice: parseFloat(task?.unitPrice), selectedTask: (task && [task]) || []}
            return newItems
        })

        clearTimeout(searchTimer)
        const apiUrl = process.env.REACT_APP_API_URL

        if (task?.workmanshipTask) {
            searchTimer = setTimeout(() => {
                
                fetch(`${apiUrl}/api/mig-tasks?workshopTasks=${task.workmanshipTask}&subsystem=${task.component.subsystem}`)
                .then(resp => resp.json())
                .then(json => {
                    if (json.length === 0) {
                        setMigratedTasks([])
                        doSetShowMigTasks(false, i)
                    }
                    else {
                        setMigratedTasks(json)
                        doSetShowMigTasks(true, i)
                    }
                })
            }, 600)
        }
    }
    
    const afterChangeUnitPrice = (val, i) => {
        setTasks(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...prevs[i], quotedPrice: parseFloat(val)}
            return newItems
        })
    }

    const [showMigTasks, setShowMigTasks] = useState([])
    const doSetShowMigTasks = (show, i) => {
        setShowMigTasks(prevs => {
            const newItems = [...prevs]
            newItems[i] = show
            return newItems
        })
    }

    const [migratedTasks, setMigratedTasks] = useState([])
    
    const afterKeyRemarks = (val, i) => {
        setTasks(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...prevs[i], remarks: val}
            return newItems
        })

        clearTimeout(searchTimer)
        const apiUrl = process.env.REACT_APP_API_URL

        if (val) {
            searchTimer = setTimeout(() => {
                fetch(`${apiUrl}/api/mig-tasks?keyword=${val}`)
                .then(resp => resp.json())
                .then(json => {
                    if (json.length === 0) {
                        setMigratedTasks([])
                        doSetShowMigTasks(false, i)
                    }
                    else {
                        setMigratedTasks(json)
                        doSetShowMigTasks(true, i)
                    }
                })
            }, 600)
        }
    }

    const afterChooseMigTasks = (migTasksIdx, taskIdx) => {
        setTasks(prevs => {
            const newItems = [...prevs]
            newItems[taskIdx] = {...prevs[taskIdx], remarks: `${migratedTasks[migTasksIdx].description}`, remarkPrice: `${migratedTasks[migTasksIdx].unitPrice}`}
            return newItems
        })
        doSetShowMigTasks(false, taskIdx)
        setMigratedTasks([])
    }

    const afterChooseSubsystem = (idx, filename) => {
        const subsystem = filename.substring(0, filename.indexOf("."))
        setTasks(prevs => {
            const newItems = [...prevs]
            let newSubsystem = subsystem
            if (newItems[idx].subsystem === subsystem) {
                newSubsystem = ''
            }
            newItems[idx] = {...prevs[idx], subsystem: newSubsystem}
            return newItems
        })
    }

    const removeItem = (v, i) => {
        if (v.id) {
            removeTask(v.serviceId, v.id)
        }
        setTasks(prev => {
            const newItems = [...prev]
            newItems.splice(i, 1)
            return newItems
        })
    }

    /* istanbul ignore next */
    const imagesContext = process.env.NODE_ENV === 'test' 
    ? Object.assign( (key) => `../images/${key}`, { keys: () => ['braking.png', 'cab.png'],} )
    : require.context('../images', false, /\.png$/)

    useEffect(() => {
        return () => clearTimeout(searchTimer)
    }, [])

    return (
        <ListGroup key="tasks">
            {tasks?.map((v, i) =>
            <ListGroup.Item key={v.rid || v.id}>
                <Row>
                        {(!v.selectedTask || v.selectedTask.length === 0) && 
                        imagesContext.keys().map((vi, ii) => 
                            <Col xs="4" lg="2" key={ii}>
                                <div role="button" aria-label={`choose subsystem ${vi.split('/').pop()}`} onClick={() => afterChooseSubsystem(i, vi.split('/').pop())}>
                                    <Image className={(v.subsystem && vi.split('/').pop().replaceAll(' ', '-').includes(v.subsystem)) ? 'bg-primary rounded' : ''} alt={vi.split('/').pop()} width={100} src={imagesContext(vi)} />
                                </div>
                            </Col>)
                        }
                </Row>
                <Row className="mb-1">
                    <Col xs="12" lg="1">
                        {v.selectedTask && v.selectedTask.length > 0 && <Image width={100} src={require(`../images/${v.selectedTask[0].component.subsystem.toLowerCase().replaceAll(' ', '-')}.png`)} />}
                    </Col>
                    <Col xs="12" lg="11">
                    <Row>
                    <Col xs="12" lg="9" className="mb-3 mb-lg-0">
                        <InputGroup>
                        <InputGroup.Text><Foreman /></InputGroup.Text>
                        <Typeahead
                            id="typeahead-task"
                            size="lg"
                            inputProps={{required:true, name: 'workmanshipTask'}}
                            labelKey={(option) => `${option?.workmanshipTask} (${option?.component?.subsystem} - ${option?.component?.componentName})`}
                            options={taskTemplates.filter(tt => v.subsystem ? tt.component.subsystem.replaceAll(' ', '-').toLowerCase() === v.subsystem : true)}
                            onChange={(opts) => afterChooseTask(opts, i)}
                            placeholder="Find a suitable task"
                            renderMenuItemChildren={(option) => 
                                <div>
                                    <div>{option.workmanshipTask} ({option.component.subsystem} - {option.component.componentName})</div>
                                    <small className="text-secondary">{option.description} ${option.unitPrice} (Complexity: {option.complexity.toLowerCase()}, estimated: {option.labourHours}H)</small>
                                </div>
                            }
                            clearButton
                            selected={v.selectedTask}
                            />
                            {v.selectedTask && v.selectedTask[0] && <InputGroup.Text role="button" aria-label={`opt for template price ${i}`}  onClick={() => afterChangeUnitPrice((v.selectedTask[0].unitPrice), i)}>${v.selectedTask[0].unitPrice}</InputGroup.Text> }
                        </InputGroup>
                    </Col>
                    <Col xs={{span: 12, order: 2}} lg={{span: 3, order: 0}}  className="mb-3 order-xs-5">
                        <InputGroup>
                            <InputGroup.Text><Dollar /></InputGroup.Text>
                            <Form.Control size="lg" onChange={(e) => afterChangeUnitPrice(e.target.value, i) } required type="number" step="10" name="quotedPrice" aria-label={`price for labour ${i}`} placeholder="Price $" value={v?.quotedPrice} />
                        </InputGroup>
                    </Col>
                    <Col xs="12" lg="11" className="mb-3">
                        <InputGroup>
                            <InputGroup.Text><NoteTaking /></InputGroup.Text>
                            <Form.Control size="lg" aria-label={`remarks for task ${i}`} onFocus={(e) => afterKeyRemarks(e.target.value, i)} 
                            onChange={(e) => afterKeyRemarks(e.target.value, i)} 
                            as="textarea" name="remarks" rows={2} value={v.remarks}></Form.Control>
                            {v.remarkPrice && <InputGroup.Text role="button" aria-label={`opt for previous price ${i}`} onClick={() => afterChangeUnitPrice(v.remarkPrice, i)}>${v.remarkPrice}</InputGroup.Text> }
                        </InputGroup>
                        {showMigTasks[i] && migratedTasks.length > 0 && <Dropdown show={true} onToggle={nextShow => {
                            if (!nextShow) {
                                setShowMigTasks(prev => {
                                    const newShows = [...prev]
                                    newShows[i] = false
                                    return newShows
                                })
                            }
                        }} onSelect={(eventKey) => afterChooseMigTasks(eventKey, i)} autoClose>
                            <Dropdown.Menu style={{maxHeight: '20rem'}} className="overflow-y-scroll">
                                {
                                    migratedTasks.map((vv, ii) => 
                                        <Dropdown.Item className="text-wrap" key={ii} eventKey={ii}>{vv.description + ' ($' + vv.unitPrice + ')'}</Dropdown.Item>
                                    )
                                }
                            </Dropdown.Menu>
                        </Dropdown> }
                    </Col>
                    <Col xs={{span: "12", order: 'last'}} lg="1" className="text-end order-xs-last">
                        <Button size="lg" variant="danger" aria-label={`remove task ${i}`} onClick={() => removeItem(v, i)}><Trash /></Button>
                    </Col>
                    </Row>
                    </Col>
                </Row>
            </ListGroup.Item>
            )}
        </ListGroup>
    )
}