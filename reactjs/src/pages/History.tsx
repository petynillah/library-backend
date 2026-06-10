import books from '../assets/books.jpg'

function History(){
    return (
        < div  className="home">
        <h1>HISTORY</h1>
    <div className='image2'>
        <img src={books} alt="Shelf of books" style={{width:'600px'}}/>
        <p className='special'>For research, personal studies,recreational reading, group work 
            projects educational studies.</p></div>
        <p>
<h2>1903: Founding and Philanthropy</h2>
<b>The Origin:</b> It was established in 1903 as the Mombasa Public Library and Free Reading Room. 
<br/><b>The Funding:</b> The library was funded and built by Seif Bin Salim, the son of Salim bin Khalfan, who was the Arab Governor (Liwali) of Mombasa at the time. 
<br/><b>Community Contributions:</b> Wealthy Asian and Indian philanthropists who arrived during the construction of the Kenya-Uganda Railway also contributed significant funding and structure to the institution. 
<br/><b>The Colonial Era:</b> Under British colonial rule, the library was originally designed to serve the information needs of Asian and European residents. However, unlike many heavily segregated spaces of the near-apartheid colonial era, it stood out for its early and continuous push toward serving diverse communities. 
<h2>1958: The Modern Facility</h2> 
<b>The Building:</b> The library initially operated out of older setups until 1958, when the current, iconic multi-story building along Msanifu Kombo Road was officially opened. 
<h2>1975: National Integration</h2>
<b>Government Takeover:</b> In 1975, the Kenya National Library Service (knls) officially took over the management of the Seif Bin Salim Public Library. 
<br/><b>Public Evolution:</b> Under knls, the facility transitioned into a truly inclusive national resource. It removed historic barriers to access and expanded its archives to include rich collections in English, Kiswahili, and various regional languages.
<h2>Today: Digital and Community Hub</h2>
<b>Modern Upgrades:</b> Now serving as the main Mombasa County branch, the library has integrated modern features like free public Wi-Fi alongside its historic print collection. 
<br/><b>Mobile Services:</b> The branch manages an active Mobile Library service, transporting books across multiple coastal counties to serve over 4,000 children in rural schools. </p>

        </div>
    )
}
export default History