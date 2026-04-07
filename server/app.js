const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/dish/create', (req, res) => {
  res.send('Vytvářím pokrm!')
})

app.post('/dish/update', (req, res) => {
  res.send('Aktualizuju pokrm!')
})

app.get('/dish/get', (req, res) => {
  res.send('Vracíím pokrm dle zadaných parametrů!')
})

app.post('/dish/delete', (req, res) => {
  res.send('Mazání pokrmu!')
})

app.get('/dish/list', (req, res) => {
  res.send('Vypisuji seznam pokrmů dle zadaných parametrů!')
})

app.listen(port, () => {
  console.log(`MenuCraft app listening on port ${port}`)
})
