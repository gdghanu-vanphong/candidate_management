import { Routes, Route } from "react-router-dom";
import './App.css'
import Login from "./pages/Login";
import { Toaster } from "@/components/ui/sonner"
import SignUp from "./pages/SignUp";

function App() {

  return (
    <>
      <Toaster/>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </>
    
  )
}

export default App
