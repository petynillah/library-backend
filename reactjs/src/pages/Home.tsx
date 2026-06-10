import image from '../assets/image.png'
import shelf from '../assets/shelf.jpg'
import childreading from'../assets/childreading.avif'

function Home(){
    return (
        <div className="home">
            
        <h1>WELCOME TO MOMBASA COUNTY LIBRARY</h1>      
        <div className='image1'>  
        <p className="special">The Mombasa County Library holds the unique distinction of being the very first public library in Kenya, boasting a history that dates back more than a century.
    </p>
        <img src={image} alt="Shelfs of books"  />
            
      {/* <img src={oldread} alt="Adults reading" style={{width:'200'}}/> */}
        </div>
<h2>LOCATION </h2>
<p>Mombasa County Library (KNLS): Located along Msanifu Kombo Street
, this is the region's primary public facility. It charges a minimal daily
 access fee of Ksh 20 for adults, and junior readers get in for free.</p>
 <img src={shelf} alt="Shelf of books" style={{width:'100%'}}/>
                          <h2>SERVICES</h2>
<p><b>Extensive Collections:</b> Access to a wide range of books in English, Kiswahili, and regional languages for all age groups.
<b>Digital Transformation:</b> The library hosts a digitization lab called the Uhifadhi Centre. You can access a Virtual Library, digital archives (maps, artworks, records), and online databases. 
</p>
<div id='link'><a href="">Sign up</a> with us</div>
<p>
<br/><b>Mobile & Outreach Programs:</b> The library runs mobile outreach services that provide books to schools, community foundations (such as the Cerebral Palsy Foundation), and children’s reading clubs. </p>
<div className='image2'>
    <img src={childreading} alt ="Children reading" />
<p className='special'>The library is spacious and has air conditioners and a conducive learning environment and proper lighting and clean lavatories and food and good arrangement</p>
        
        </div>
    </div>

    )
}
export default Home