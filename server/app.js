const express = require('express')
const app = express()
const port = 3000

app.use(express.json()); //podpora pro parsování JSON těla požadavků
app.use(express.urlencoded({ extended: true })); //podpora pro parsování URL-encoded těla požadavků 

import dishController from './controllers/dish';
app.use('/dish', dishController);

app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`MenuCraft app listening on port ${port}`)
})
