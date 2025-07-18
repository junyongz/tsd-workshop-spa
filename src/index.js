import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { WorkshopServicesProvider } from './services/ServiceContextProvider';
import { SupplierOrderProvider } from './suppliers/SupplierOrderContextProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <WorkshopServicesProvider>
        <SupplierOrderProvider>
          <App />
        </SupplierOrderProvider>
      </WorkshopServicesProvider>
    </BrowserRouter>
  </React.StrictMode>
);
