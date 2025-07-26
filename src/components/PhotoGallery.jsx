import { Button, Carousel, Image } from "react-bootstrap"
import { Download } from "../Icons"
import download from "../utils/downloadUtils"

export default function PhotoGallery({uploadedMedias}) {
    return (
        <Carousel data-bs-theme="light" interval={null}
            nextIcon={<Button><i className="bi bi-chevron-right"></i></Button>}
            prevIcon={<Button><i className="bi bi-chevron-left"></i></Button>}>
            { uploadedMedias.map(v => 
                <Carousel.Item key={v.id}>
                    <Image src={v.dataUrl} className="d-block w-100" style={{width: '640px'}}/>
                    <Carousel.Caption>
                        <Button variant="success" aria-label={`download media ${v.fileName}`}
                            onClick={() => download(v.dataUrl, v.fileName)}><Download /> {v.fileName}</Button>
                    </Carousel.Caption>
                </Carousel.Item>
            ) }
        </Carousel>
    )
}