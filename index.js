
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000 


// here I used to middleware 
app.use(cors())
app.use(express.json())


app.get('/', (req, res) =>{
    res.send('DIGITAL SHOP')
})
app.listen(port, () =>{
    console.log(`app is running on port: ${port}`)
})