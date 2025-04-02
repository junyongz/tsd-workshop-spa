import { Button } from "react-bootstrap";

const CompletionLabel = ({creationDate, completionDate, onCompletion}) => {

    if (!completionDate) {
        return (
            <Button variant="outline-warning" onClick={onCompletion} size="sm">Complete Service</Button>
        )
    }

    return (
        <label className="text-body-secondary fs-6">Completed on {creationDate !== completionDate ? completionDate : 'same day'}</label>
    )
}


export default CompletionLabel;