import { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Container, Modal, Row, Stack } from "react-bootstrap";
import SparePartDialog from "./SparePartDialog";
import PromptDeletionIcon from "../components/PromptDeletionIcon";
import { Company, Suppliers, Truck } from "../Icons";
import { clearState } from "../autoRefreshWorker";
import PhotoGallery from "../components/PhotoGallery";
import { useSupplierOrders } from "../suppliers/SupplierOrderContextProvider";

/**
 * @typedef {Object} SparePart
 * @property {number} id
 * @property {string} partNo
 * @property {string} partName
 * @property {string} description
 * @property {Object[]} oems
 * @property {string} oems[].name
 * @property {string} oems[].url
 * @property {Object[]} compatibleTrucks
 * @property {string} compatibleTrucks[].make
 * @property {string} compatibleTrucks[].model
 * @property {number[]} orderIds list of id link to supplier order id
 */

/**
 * 
 * @param {Object} props 
 * @param {import("../suppliers/SupplierOrders").Supplier[]} props.suppliers
 * @param {import("../App").SearchOption[]} props.selectedSearchOptions
 * @param {number} props.totalSpareParts
 * @param {React.SetStateAction<number>} props.setTotalSpareParts
 * @returns 
 */
export default function SpareParts({suppliers, selectedSearchOptions, totalSpareParts, setTotalSpareParts}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const orders = useSupplierOrders()

    const [showSparePartDialog, setShowSparePartDialog] = useState(false)
    // not really care about the ordering actually
    const [uploadedMedias, setUploadedMedias] = useState([])
    const [currentPreviewSparePart, setCurrentPreviewSparePart] = useState()

    const observer = useRef();
    const fetchMediaTimeouts = useRef(new Map());
    const fetchedMediasSparePartIds = useRef(new Set())

    /* const sampleSparePart = {id: 1000, partNo: '44350-1610', partName: 'Power Steering Pump',
            description: "Generates hydraulic pressure to assist in turning the vehicle's wheels, making steering easier and smoother, especially at low speeds",
            oems: [{name: 'XSMY Co.', url: 'http://xsmy.co'}], 
            compatibleTrucks: [{make: 'Hino', model: '500'}, {make: 'Hino', model: '700'}], 
            supplierIds: [19936, 9799],
            orderIds: [19929, 9767]} */
    /**
     * @type {[SparePart[], React.SetStateAction<SparePart[]>]}
     */
    const [spareParts, setSpareParts] = useState([])

        /**
     * @type {[SparePart, React.SetStateAction<SparePart>]}
     */
    const [existingSparePart, setExistingSparePart] = useState()

    /**
     * 
     * @param {SparePart} sp spare part 
     * @returns whether anything matched to search options
     */
    const matchSearchOptions = (sp) => {
        if (selectedSearchOptions.length === 0) {
            return true
        }

        return selectedSearchOptions.some(opt => {
            const lowerCase = opt.name.toLowerCase()
            return sp.partNo?.toLowerCase().includes(lowerCase) ||
                    sp.partName?.toLowerCase().includes(lowerCase) ||
                    sp.description?.toLowerCase().includes(lowerCase) ||
                    sp.compatibleTrucks?.some(t => t.make.toLowerCase().includes(lowerCase) || 
                                                t.model.toLowerCase().includes(lowerCase) ||
                                                (t.make + ' ' + t.model).toLowerCase().includes(lowerCase))
        })
    }

    // TODO passing the uploaded medias in individual dialog over here
    /**
     * @param {SparePart} sparePart spare part 
     */
    const afterSave = (sparePart) => {
        const existing = spareParts.findIndex(sp => sp.id === sparePart.id)

        setSpareParts(prev => {
            const newItems = [...prev]

            if (existing >= 0) {
                newItems[existing] = sparePart
                return newItems
            }
            else {
                return [sparePart, ...newItems]
            }
        })

        orders.updateOrdersSparePartId(sparePart.id, sparePart.orderIds)
    }

    const afterRemoveMedia = (media) => {
        setUploadedMedias(prev => [...prev.filter(um => um.id !== media.id)])
    }

    /**
     * 
     * @param {SparePart} sparePart 
     */
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

            setSpareParts(prev => {
                const newItems = [...prev]
                newItems.splice(newItems.findIndex(sp => sp.id === deleteId), 1)
                return newItems
            })
            setTotalSpareParts(totalSpareParts-1)
        })
        .finally(() => {
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
        fetch(`${apiUrl}/api/spare-parts`, {
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(resp => resp.json())
        .then(setSpareParts)
    }, [])

    useEffect(() => {
        observer.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const sparePartId = entry.target.dataset.sparePartId;
                    if (fetchedMediasSparePartIds.current.has(sparePartId)) return

                    if (entry.isIntersecting) {
                        const timeoutId = setTimeout(() => {
                            if (entry.isIntersecting) {
                                fetchSparePartMediaPromise(sparePartId)
                                    .then(datas => {
                                        setUploadedMedias(prev => [...prev, ...datas.flatMap(res => res.value)])
                                    })
                                    .finally(() => {
                                        // ensure the "intersecting" wont happen anymore, very important!
                                        observer.current.unobserve(entry.target)
                                        fetchedMediasSparePartIds.current.add(sparePartId)
                                    })
                            }
                            fetchMediaTimeouts.current.delete(sparePartId);
                        }, 800);
                        fetchMediaTimeouts.current.set(sparePartId, timeoutId);
                    } 
                    else {
                        const timeoutId = fetchMediaTimeouts.current.get(sparePartId);
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            fetchMediaTimeouts.current.delete(sparePartId);
                        }
                    }
                });
            },
            { threshold: 0.1 }
        );

        // better to brute force use vanilla javascript instead of react useRef
        // since IntersectionObserver are Web API, it's okay to do such way too
        document.querySelectorAll('.spare-part-card').forEach(elem => observer.current.observe(elem))

        return () => {
            fetchMediaTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId))
            fetchMediaTimeouts.current.clear()
            observer.current.disconnect()
        };
    }, [spareParts, selectedSearchOptions]);

    return (
        <Container fluid>
        <Row>
            <Col><SparePartDialog isShow={showSparePartDialog} 
                setShowDialog={setShowSparePartDialog} 
                suppliers={suppliers}
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
                    { spareParts.filter(matchSearchOptions).map(v => {
                    const matchedOrders = orders.list().filter(o => o.sparePartId === v.id)
                    const supplierIds = Array.from(new Set(matchedOrders.map(mo => mo.supplierId)))

                    matchedOrders.sort((a, b) => a.unitPrice - b.unitPrice)
                    const hasVariousPrices = Array.from(new Set(matchedOrders.map(mo => mo.unitPrice))).length > 1

                    return <Col xs="12" sm="6" md="4" lg="3" role="menuitem" className="mb-3" key={v.id}>
                            <Card className="spare-part-card" data-spare-part-id={v.id}>
                            <Card.Header role="button" aria-label={`header for ${v.partName}`} onClick={() => showDialogFor(v)}>
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
                                    <div key={spId}>{suppliers.find(sp => sp.id === spId)?.supplierName}</div>
                                )}
                                {!hasVariousPrices && <span className="text-secondary">${matchedOrders[0]?.unitPrice}</span>}
                                {hasVariousPrices && <span className="text-secondary">${matchedOrders[0]?.unitPrice} - ${matchedOrders[matchedOrders.length - 1]?.unitPrice}</span>}
                            </Row>
                            {uploadedMedias.filter(um => um.sparePartId === v.id).map(md => 
                            <img key={md.id} role="button" aria-label={`view photos for part ${md.sparePartId}`} onClick={() => setCurrentPreviewSparePart(v)} 
                                className="rounded-pill"
                                src={md.dataUrl} style={{width:'30%', marginRight: '5px'}}/> )}
                            </Card.Body>
                    </Card></Col>
                    })}
                </Row>
            </Col>
        </Row>
        </Container>
    )
}