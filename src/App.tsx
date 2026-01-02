import { Routes, Route } from "react-router-dom";
import './App.css'
import Login from "./pages/Login";
import { Toaster } from "@/components/ui/sonner"
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import ConfirmEmail from "./pages/ConfirmEMail";

function App() {

  return (
    <>
      <Toaster/>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
      </Routes>
    </>
    
  )
}

export default App
