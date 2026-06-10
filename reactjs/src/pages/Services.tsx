import books from '../assets/books.jpg'
import chidread from '../assets/childread.jpg'
import quote from '../assets/quote.png'

function Services(){
    return(
    <div className="home">
    <h1>SERVICES OFFERED AND ELIGIBILTY</h1>
    <div className='read1'>
    <img src={chidread} alt='Children reading'/>
    <p>The library charges minimal standard <a href=''>knls Fees & Pricing</a> to keep the facility accessible: 
<br/><b>Daily Access Fee:</b> Ksh 20 for adults and secondary school students.
<br/><b>Junior Readers:</b> Free entry for younger children.
<br/><b>Book Loaning:</b> Free registration is available for adult membership, while borrowing requires a fee of Ksh 20 per book. </p>
</div>
<div className='read1'>

<p>Mombasa county library serves as an accessible centre for education, recreation and research.
<br/>The library houses a large catalog spanning multiple floors, including fiction, non-fiction, historical data, medical texts, and local regional languages.</p>

<img src={books} alt='Shelf of books'/>
</div >
<p> <b>Digital and Community Hub</b><br/>
The library has integrated modern features like free public Wi-Fi.
<br/><b>Mobile Services:</b> The branch manages an active Mobile Library service, transporting books across multiple coastal counties to serve over 4,000 children in rural schools. </p>

<img src={quote} alt='Quote bt Conergie'/>
    </div>
    )
}
export default Services