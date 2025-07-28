import { useState } from "react"
import { Trash } from "../Icons";
import { Button } from "react-bootstrap";

export default function PromptDeletionButton({confirmDelete}) {
    const [promptDelete, setPromptDelete] = useState(false);

    const afterConfirmDelete = () => {
        confirmDelete()
        setPromptDelete(false)
    }

    return (
        <>
        { promptDelete && <Button aria-label="cancel remove" variant="outline-warning" onClick={() => setPromptDelete(false)}>X</Button> }
        <Button aria-label="remove" variant={promptDelete ? 'outline-danger' : 'outline-warning'}
            onClick={() => promptDelete ? afterConfirmDelete() : setPromptDelete(true)}>
            <Trash />
        </Button>
        </>
    )
}