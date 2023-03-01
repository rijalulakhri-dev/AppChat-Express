const express = require('express')
const bodyParser = require('body-parser')
const app = express() //reference constiable
const http = require('http').Server(app)
const io = require('socket.io')(http)
const mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
mongoose.Promise = Promise
const dbUrl = 'mongodb://127.0.0.1:27017/belajar_nodejs'
mongoose.set('strictQuery', true)

const Message = mongoose.model('Message', {
    nama: String,
    pesan: String
}) //schema definition

const Badword = mongoose.model('Badword', {
    word: String
})

function getBadwords() {
    return Badword.find().exec()
}

function filterMessage(message, badwords) {
    badwords.forEach((badword) => {
        const regex = new RegExp(`\\b${badword.word}\\b`, 'gi')
        message = message.replace(regex, '*'.repeat(badword.word.length))
    })
    return message
}

  
app.get('/pesan', function (req, res) {
    Message.find({}, function (err, pesan) {
        res.send(pesan)
    })
})

// app.post('/pesan', async function (req, res) {

//     try{
//         const message = new Message(req.body)

//         const savedMessage = message.save()
//         console.log('tersimpan')
//         const sensor = await Message.findOne({pesan:'badword'})

//         if (sensor) {
//             console.log('kata badword ditemukan!', sensor)
//             await Message.deleteMany({_id:sensor.id})
//         }else {
//             io.emit('pesan', req.body)
//         }
//         res.sendStatus(200)
//     }catch (error) {
//         res.sendStatus(500)
//         return console.log(error)
//     }finally {
//         console.log('post pesan panggil')
//     }
// })

app.post('/pesan', async function (req, res) {
    try {
        const message = new Message(req.body)

        const savedMessage = await message.save()
        console.log('tersimpan')
        const badwords = await getBadwords()
        const filteredMessage = filterMessage(req.body.pesan, badwords)
        if (filteredMessage !== req.body.pesan) {
            console.log('kata-kata kasar ditemukan dan diblokir!')
        }
        io.emit('pesan', {...req.body, pesan: filteredMessage})
        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
        console.error(error)
    }
})

app.delete('/pesan', async function (req, res) {
    try {
        const deletedCount = await Message.deleteMany({})
        console.log(`Menghapus ${deletedCount.deletedCount} pesan`)
        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
        console.error(error)
    }
})


io.on('connection', function (socket) {
    console.log('a user connected!')
})

mongoose.connect(dbUrl, function (err) {
    console.log('koneksi ke mongodb berhasil!', err)
})

const server = http.listen(3000, function () {
    console.log("port server adalah", server.address().port)
})