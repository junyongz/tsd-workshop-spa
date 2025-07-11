import { useState } from "react"
import { Trash } from "../Icons";

export default function PromptDeletionIcon({confirmDelete, flip=false}) {
    const [promptDelete, setPromptDelete] = useState(false);

    const afterConfirmDelete = () => {
        confirmDelete()
        setPromptDelete(false)
    }

    return (
        <>
        { flip && promptDelete && <span role="button" name="remove" className="text-warning me-2" onClick={(e) => {e.stopPropagation(); setPromptDelete(false)}}>X</span> }
        <span role="button" name="remove" aria-label="remove" className={promptDelete ? 'text-danger me-1' : 'text-warning me-2'}
            onClick={(e) => {e.stopPropagation(); promptDelete ? afterConfirmDelete() : setPromptDelete(true)}}>
            <Trash />
        </span>
        { !flip && promptDelete && <span role="button" name="remove" className="text-warning me-2" onClick={(e) => {e.stopPropagation(); setPromptDelete(false)}}>X</span> }
        </>
    )
}