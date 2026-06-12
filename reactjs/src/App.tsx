
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import History from './pages/History'
import Services from './pages/Services'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Studentreg from './pages/Studentreg'
import Studentlogin from './pages/Studentlogin'


function App() {
  return (
  <>
  <BrowserRouter>
    <Nav/>
  <Routes>
    <Route path="/"  element={<Home/>}/>
    <Route path ="/history" element={<History/>}/>
    <Route path="/services" element={<Services/>}/>
    <Route path='/studentlogin' element={<Studentlogin/>}/>
    <Route path='/studentreg' element={<Studentreg/>}/>
  </Routes>
    <Footer/>
  </BrowserRouter>
    </>
  )
}

export default App
