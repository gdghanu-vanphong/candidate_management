import { Routes, Route, BrowserRouter } from "react-router-dom";

import './App.css'
import Login from "./pages/Login";

function App() {

  return (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  )
}

export default App
