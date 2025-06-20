import { useEffect, useState } from "react";

import './HoverPilledBadge.css';
import PromptDeletionIcon from "./PromptDeletionIcon";
import { Trash } from "../Icons";

const HoverPriceTag = ({onRemove, children }) => {
    const [isHovered, setIsHovered] = useState(false)
    const [promptDelete, setPromptDelete] = useState(false)
  
    return (
      <div
        pill
        bg="dark"
        className={ "price-tag hover-badge text-center" + (promptDelete ? ' clicked' : '') }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setPromptDelete(false) }}
        onClick={() => {
          if (isHovered) {
            if (promptDelete) {
              onRemove()
            }
            else {
              setPromptDelete(true)
            }
          }
        }}
        role="button"
      >
        {isHovered ? <Trash />  : children}
      </div>
    );
};

export default HoverPriceTag;