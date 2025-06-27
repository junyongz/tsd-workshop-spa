const useNavigate = jest.fn() // so that the function always the same
module.exports = {
  BrowserRouter: ({ children }) => <div>{children}</div>,
  useNavigate: () => useNavigate
};