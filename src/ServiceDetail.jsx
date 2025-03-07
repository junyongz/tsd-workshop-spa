import React, { useState, useEffect } from 'react';
import { Container, ListGroup } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);

  useEffect(() => {
    fetch(`YOUR_API_ENDPOINT/services/${id}`)
    .then(res => res.json())
    .then(response => {
      setService(response.data);
    }).catch(error => {
      console.error('There was an error fetching the service:', error);
    });
  }, [id]);

  if (!service) return <div>Loading...</div>;

  return (
    <Container>
      <h1>Service Details</h1>
      <ListGroup>
        <ListGroup.Item><strong>Date:</strong> {service.date}</ListGroup.Item>
        <ListGroup.Item><strong>Spare Parts:</strong> {service.spareParts.map(part => (
          <div key={part.id}>
            {part.name} - Stock: {part.stock}, Original Cost: {part.originalCost}
          </div>
        ))}</ListGroup.Item>
        <ListGroup.Item><strong>Price:</strong> {service.price}</ListGroup.Item>
        <ListGroup.Item><strong>Foreman:</strong> {service.foreman}</ListGroup.Item>
      </ListGroup>
    </Container>
  );
}

export default ServiceDetail;