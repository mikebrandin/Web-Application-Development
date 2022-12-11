// Mike Brandin - Project 3 - CPSC 3750
//
// URL: http://ec2-3-89-48-191.compute-1.amazonaws.com/project3/

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/time', (req, res) => {
  res.send(new Date().toString())
})

app.get('*', (req, res) => {
  res.send('The path was ' + req.path)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
