import logo from '../assets/logo.jpg'

function Nav(){
    return (
        <section className="nav">
            <img src={logo}/>
        <ul> 
            <li><a href="/">Home</a></li>
            <li><a href="/history">History</a></li>
            <li><a href="/services">Services offered $ eligibility</a></li>
            <li><a href="/studentlogin">Login/Registration</a></li>
            <li><a href="/studentreg">Login/Registration</a></li>
        </ul>
        </section>
    )
}
export default Nav