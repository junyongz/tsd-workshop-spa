import { Button, Carousel, Image } from "react-bootstrap"
import { Download } from "../Icons"

export default function PhotoGallery({uploadedMedias}) {
    return (
        <Carousel data-bs-theme="light" interval={null}
            nextIcon={<Button><i className="bi bi-chevron-right"></i></Button>}
            prevIcon={<Button><i className="bi bi-chevron-left"></i></Button>}>
            { uploadedMedias.map(v => 
                <Carousel.Item key={v.id}>
                    <Image src={v.dataUrl} className="d-block w-100" style={{width: '640px'}}/>
                    <Carousel.Caption>
                        <Button variant="success" onClick={() => {
                            const link = document.createElement('a')
                            link.href = v.dataUrl
                            link.download = v.fileName
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                        }}><Download /> {v.fileName}</Button>
                    </Carousel.Caption>
                </Carousel.Item>
            ) }
        </Carousel>
    )
}