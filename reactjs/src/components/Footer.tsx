import { FaFacebook, FaInstagram, FaXTwitter } from "react-icons/fa6"

function Footer(){
    return (
        <>
            <div className="foot">
                    <ul>
            <li className="bold">Social media</li>
            <li><a href=""><FaInstagram color="#E1306C"/> Instagram</a></li>
            <li><a href=""><FaFacebook color="#1877F2"/>  Facebook</a></li>
            <li><a href=""><FaXTwitter/>  X/Twitter</a></li>
        </ul>
        <ul>
            <li className="bold">Contact us</li>
            <li><a href="">library@gmail.com</a></li>
            <li><a href="">+2357918634</a></li>
            <li><a href="">0728974633</a></li>
        </ul>

        <ul>
            <li className="bold">Usefull links</li>
            <li><a href="/"> Home</a></li>
            <li><a href="">Login</a></li>
            <li><a href="">Register</a></li>
            <li><a href="/history">History</a></li>
            <li><a href="/services">Services offered</a></li>
            <li><a href="/services">Eligibility</a></li>
        </ul>
        </div>
        </>
    )
}
export default Footer