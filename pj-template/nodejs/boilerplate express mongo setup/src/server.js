import express from 'express'

const app = express()
const hostname = 'localhost' // Replace by domain if needed
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.listen(PORT, hostname, () => {
  console.log(`Server is running on http://${hostname}:${PORT}`)
})
