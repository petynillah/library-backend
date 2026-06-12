function Studentreg(){
    return(
        <>
        <h1>STUDENT REGISTRATION PORTAL</h1>
        <form>
            <label>Name</label>
            <input type="text" name="firstname" value={'First name'}/>
            <input type="text" name="lastname" value={'Last name'}/>
            <input type="text" name="othername" value={'Other name'}/><br/>
            <label>Gender</label>
            
            <label>Age</label>
            <input type="number" name="age" /><br/>
            <label>Education Level</label>
            
            <label>School/ Institution Name</label><br/>
            
        </form>
        </>
    )
}
export default Studentreg