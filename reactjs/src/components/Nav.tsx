import logo from '../assets/logo.jpg'

function Nav(){
    return (
        <section className="nav">
            <img src={logo}/>
        <ul> 
            <li><a href="/">Home</a></li>
            <li><a href="/history">History</a></li>
            <li><a href="/services">Services offered $ eligibility</a></li>
            <li><a href="http://localhost:5174/studentlogin" target="_blank">Login/Registration</a></li>
        </ul>
        </section>
    )
}
export default Nav