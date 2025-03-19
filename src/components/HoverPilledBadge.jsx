import { useState } from "react";

import Badge from "react-bootstrap/Badge";
import './HoverPilledBadge.css';


const HoverPilledBadge = ({ onRemove, children }) => {
    const [isHovered, setIsHovered] = useState(false);
  
    return (
      <Badge
        pill
        bg="primary"
        className="hover-badge"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => isHovered && onRemove()} // Only trigger onRemove when showing the "X"
        role="button"
      >
        {isHovered ? 'x' : children}
      </Badge>
    );
};

export default HoverPilledBadge;