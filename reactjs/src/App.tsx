
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import History from './pages/History'
import Services from './pages/Services'
import Nav from './components/Nav'
import Footer from './components/Footer'


function App() {
  return (
  <>
  <BrowserRouter>
    <Nav/>
  <Routes>
    <Route path="/"  element={<Home/>}/>
    <Route path ="/history" element={<History/>}/>
    <Route path="/services" element={<Services/>}/>
    
  </Routes>
    <Footer/>
  </BrowserRouter>
    </>
  )
}

export default App
