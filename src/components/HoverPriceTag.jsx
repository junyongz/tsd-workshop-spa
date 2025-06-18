import { useState } from "react";

import './HoverPilledBadge.css';
import { Trash } from "../Icons";


const HoverPriceTag = ({onRemove, children }) => {
    const [isHovered, setIsHovered] = useState(false);
  
    return (
      <div
        pill
        bg="dark"
        className="price-tag hover-badge text-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => isHovered && onRemove()}
        role="button"
      >
        {isHovered ? <Trash /> : children}
      </div>
    );
};

export default HoverPriceTag;