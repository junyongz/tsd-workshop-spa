import { useState } from "react";

import Badge from "react-bootstrap/Badge";
import './HoverPilledBadge.css';
import { Trash } from "../Icons";


const HoverPilledBadge = ({ onRemove, children }) => {
    const [isHovered, setIsHovered] = useState(false);
  
    return (
      <Badge
        pill
        bg="dark"
        className="hover-badge w-75 fs-5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => isHovered && onRemove()} // Only trigger onRemove when showing the "X"
        role="button"
      >
        {isHovered ? <Trash /> : children}
      </Badge>
    );
};

export default HoverPilledBadge;