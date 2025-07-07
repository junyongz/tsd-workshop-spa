import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Modal, Row, Stack } from "react-bootstrap";
import SupplierOrders from "../suppliers/SupplierOrders";
import SparePartDialog from "./SparePartDialog";
import PromptDeletionIcon from "../components/PromptDeletionIcon";
import { Company, HandPointer, Suppliers, Truck } from "../Icons";
import { clearState } from "../autoRefreshWorker";
import PhotoGallery from "../components/PhotoGallery";

export default function SpareParts({orders=new SupplierOrders(), suppliers=[], selectedSearchOptions=[], totalSpareParts=0, setTotalSpareParts}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [showSparePartDialog, setShowSparePartDialog] = useState(false)
    // not really care about the ordering actually
    const [uploadedMedias, setUploadedMedias] = useState([])
    const [currentPreviewSparePart, setCurrentPreviewSparePart] = useState()

    const pageSize = 4
    const [activePage, setActivePage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)

    const [prevSelectedSearchOptions, setPrevSelectedSearchOptions] = useState(selectedSearchOptions)
    if (prevSelectedSearchOptions !== selectedSearchOptions) {
        setActivePage(1)
        setPrevSelectedSearchOptions(selectedSearchOptions)
    }

    // update existing dont need to append, based on sparePart state (by id)
    // add new one, add to the beginning, and remove the last one
    // remove, calling for active page, add the last one to the sparePart state

    const sampleSparePart = {id: 1000, partNo: '44350-1610', partName: 'Power Steering Pump',
            description: "Generates hydraulic pressure to assist in turning the vehicle's wheels, making steering easier and smoother, especially at low speeds",
            oems: [{name: 'XSMY Co.', url: 'http://xsmy.co'}], 
            compatibleTrucks: [{make: 'Hino', model: '500'}, {make: 'Hino', model: '700'}], 
            supplierIds: [19936, 9799],
            orderIds: [19929, 9767]}
    const [spareParts, setSpareParts] = useState([])

    const [existingSparePart, setExistingSparePart] = useState()

    const matchSearchOptions = (sp) => {
        if (selectedSearchOptions.length === 0) {
            return true
        }

        return selectedSearchOptions.some(opt => {
            const lowerCase = opt.name.toLowerCase()
            return sp.partNo.toLowerCase().includes(lowerCase) ||
                    sp.partName.toLowerCase().includes(lowerCase) ||
                    sp.description.toLowerCase().includes(lowerCase) ||
                    sp.compatibleTrucks.some(t => t.make.toLowerCase().includes(lowerCase) || 
                                                t.model.toLowerCase().includes(lowerCase) ||
                                                (t.make + ' ' + t.model).toLowerCase().includes(lowerCase))
        })
    }

    // TODO passing the uploaded medias in individual dialog over here


    const afterSave = (sparePart) => {
        const existing = spareParts.findIndex(sp => sp.id === sparePart.id)
        const lastSparePart = existing === -1 ? spareParts[spareParts.length - 1] : undefined

        setSpareParts(prev => {
            const newItems = [...prev]

            if (existing >= 0) {
                newItems[existing] = sparePart
                return newItems
            }
            else {
                // only remove the last one, if there is more to load, it's ok to keep on adding
                if (activePage !== totalPages) {
                    newItems.splice(newItems.length - 1, 1)
                }
                return [sparePart, ...newItems]
            }
        })

        // so not to load again for the same media
        if (lastSparePart) {
            setUploadedMedias(prev => [...prev.filter(um => um.sparePartId !== lastSparePart.id)])
        }

        // to add parameter to this function
        fetchSparePartMediaPromise(sparePart.id)
            .then(medias => {
                setUploadedMedias(um => {
                    const newItems = [...um].filter(um => um.sparePartId !== sparePart.id)
                    return [...newItems, ...medias.flatMap(res => res.value)]
                })
            })

        orders.updateOrdersSparePartId(sparePart.id, sparePart.orderIds)
    }

    const afterRemoveMedia = (media) => {
        setUploadedMedias(prev => [...prev.filter(um => um.id !== media.id)])
    }

    const showDialogFor = (sparePart) => {
        setExistingSparePart(sparePart)
        setShowSparePartDialog(true)
    }

    // fetch spare parts here
    // to fetch medias separately
    // to use orders, and orderIds as json fields 
    // dialog to have orders screen to map

    const removeSparePart = (v) => {
        fetch(`${apiUrl}/api/spare-parts/${v.id}`, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(resp => resp.json())
        .then(deleteId => {
            orders.removeSparePart(deleteId)
        })
        .finally(() => {
            setActivePage(1)
            clearState()
        })
    }

    const fetchSparePartMediaPromise = async (sparePartId) => {
        return fetch(`${apiUrl}/api/spare-parts/${sparePartId}/medias`)
                .then(resp => resp.json())
                .then(medias => 
                    Promise.allSettled(medias.map(md =>
                        fetch(`${apiUrl}/api/spare-parts/${sparePartId}/medias/${md.id}/data`)
                            .then(resp => resp.blob())
                            .then(blob => { return {...md, dataUrl: URL.createObjectURL(blob) } })
                    ))
                )
    }

    useEffect(() => {
        const keywords = selectedSearchOptions.map(opt => `keyword=${opt.name}`).join('&')

        fetch(`${apiUrl}/api/spare-parts?pageNumber=${activePage}&pageSize=${pageSize}${keywords.trim().length > 0 ? ('&' + keywords) : ''}`, {
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(resp => {
            setTotalSpareParts(parseInt(resp.headers.get('X-Total-Elements')))
            setTotalPages(parseInt(resp.headers.get('X-Total-Pages')))

            return resp.json()
        })
        .then(spJson => {
            const promises = spJson.map(sp => fetchSparePartMediaPromise(sp.id))

            Promise.allSettled(promises)
                .then(datas => {
                    setUploadedMedias(prev => activePage === 1 
                        ? datas.filter(p => p.value.length > 0).flatMap(res => res.value).map(res => res.value)
                        : [...prev, ...datas.filter(p => p.value.length > 0).flatMap(res => res.value).map(res => res.value)])
                })
                .finally(() => setSpareParts(prev => {
                        // console.table(prev)
                        // console.table(spJson)
                        return activePage === 1 ? spJson : [...prev, ...spJson]
                    }
                ))
        })

        return () => {
            // but the clean up would looking at previous render value instead latest value
            if (activePage > 1 && selectedSearchOptions.length > 0) {
                // always reset to page 1 for search options changed
                setActivePage(1)
            }
        }

    }, [activePage, selectedSearchOptions])

    return (
        <Container fluid>
        <Row>
            <Col><SparePartDialog isShow={showSparePartDialog} 
                setShowDialog={setShowSparePartDialog} 
                orders={orders} suppliers={suppliers}
                afterSave={afterSave}
                sparePart={existingSparePart}
                setSparePart={setExistingSparePart} 
                afterRemoveMedia={afterRemoveMedia}/></Col>
        </Row>
       {currentPreviewSparePart && <Row>
            <Col>
            <Modal show={true} onHide={() => setCurrentPreviewSparePart()}  size="lg">
                <Modal.Header closeButton>
                    {currentPreviewSparePart.partNo} - {currentPreviewSparePart.partName}
                </Modal.Header>
                <Modal.Body className="text-center">
                   <PhotoGallery uploadedMedias={uploadedMedias.filter(um => um.sparePartId === currentPreviewSparePart.id)} />
                </Modal.Body>
            </Modal>
            </Col>
        </Row> }
        <Row className="mb-3">
            <Col className="text-end">
                <Button aria-label="button to show dialog for add/edit spare part" variant='success' 
                    onClick={() => {setExistingSparePart({oems:[],compatibleTrucks:[]}); setShowSparePartDialog(true)}}>
                        <i className="bi bi-plus-circle-fill"></i> Add New</Button>
                
            </Col>
        </Row>
        <Row>
            <Col>
                <Row>
                    { spareParts.map(v => {
                    const matchedOrders = orders.list().filter(o => o.sparePartId === v.id)
                    const supplierIds = Array.from(new Set(matchedOrders.map(mo => mo.supplierId)))

                    matchedOrders.sort((a, b) => a.unitPrice - b.unitPrice)
                    const hasVariousPrices = Array.from(new Set(matchedOrders.map(mo => mo.unitPrice))).length > 1

                    return <Col xs="12" sm="6" md="4" lg="3" role="menuitem" className="mb-3" key={v.id}>
                            <Card>
                            <Card.Header role="button" onClick={() => showDialogFor(v)}>
                                <div className="fs-5">
                                    <Stack direction="horizontal">
                                    <div className="w-75"><span>{v.partNo}</span></div>
                                    <div className="w-25 text-end"><PromptDeletionIcon confirmDelete={() => removeSparePart(v)}/></div>
                                    </Stack>
                                </div>
                                <div className="fw-bold">{v.partName}</div>
                            </Card.Header>
                            <Card.Body>
                            
                            <Row>
                            <Col xs="12" className="mb-3">
                            <span className="d-block text-secondary">{v.description}</span>
                            </Col>
                            <Col xs="6">
                            <Company />
                                {v.oems.map((o, i) => 
                                    <div key={i}><a href={o.url}>{o.name}</a></div>
                                )}
                            </Col>
                            <Col xs="6" className="mb-3">
                            <Truck />
                                {v.compatibleTrucks?.map((t, i) => 
                                    <div key={i}>{t.make} {t.model}</div>
                                )}
                            </Col>

                            <Suppliers />
                                {supplierIds.map(spId => 
                                    <div>{suppliers.find(sp => sp.id === spId)?.supplierName}</div>
                                )}
                                {!hasVariousPrices && <span className="text-secondary">${matchedOrders[0]?.unitPrice}</span>}
                                {hasVariousPrices && <span className="text-secondary">${matchedOrders[0]?.unitPrice} - ${matchedOrders[matchedOrders.length - 1]?.unitPrice}</span>}
                            
                            </Row>
                            {uploadedMedias.filter(um => um.sparePartId === v.id).map(md => 
                            <img key={md.id} role="button" onClick={() => setCurrentPreviewSparePart(v)} 
                                className="rounded-pill"
                                src={md.dataUrl} style={{width:'30%', marginRight: '5px'}}/> )}
                            </Card.Body>
                    </Card></Col>
                    })}
                </Row>
            </Col>
        </Row>
        { activePage < totalPages  && <Row className="mb-3">
            <Col className="text-center">
                <span role="button" id="more-button" onClick={() => setActivePage(prev => prev+1)}>Total {totalSpareParts} items. <HandPointer /> Click to load more.</span>
            </Col>
        </Row> }
        </Container>
    )
}