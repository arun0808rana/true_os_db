const express = require('express')
const app = express()
//const cors = require('cors')
//require('dotenv').config()
const PORT = 7474;

//app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`http://localhost:PORT`)
})