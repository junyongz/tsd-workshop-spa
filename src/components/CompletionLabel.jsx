import { useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";

const CompletionLabel = ({creationDate, completionDate, onCompletion, onDelete}) => {

    const [promptDelete, setPromptDelete] = useState(false)

    const confirmDelete = () => {
        onDelete()
        setPromptDelete(false)
    }

    if (!completionDate) {
        return (
            <ButtonGroup>
                <Button variant="outline-success" onClick={onCompletion} size="sm">Complete Service</Button>
                { promptDelete && <Button variant="outline-warning" onClick={() => setPromptDelete(false)}>X</Button> }
                <Button variant={promptDelete ? 'outline-danger' : 'outline-warning'}
                    onClick={() => promptDelete ? confirmDelete() : setPromptDelete(true)}>
                    <i role="button" className="bi bi-trash3"></i>
                </Button>
            </ButtonGroup>
        )
    }

    return (
        <label className="text-body-secondary fs-6">Completed on {creationDate !== completionDate ? completionDate : 'same day'}</label>
    )
}


export default CompletionLabel;