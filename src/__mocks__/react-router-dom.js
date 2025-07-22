import React from "react";

const useNavigate = jest.fn() // so that the function always the same
const useLocation = jest.fn()
module.exports = {
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({children}) => <React.Fragment>{children}</React.Fragment>,
  Route: ({element}) => <React.Fragment>{element}</React.Fragment>,
  useNavigate: () => useNavigate,
  useLocation: useLocation
};