
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const query = require('express/lib/middleware/query');
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config();


//middleware
app.use(cors())
app.use(express.json());
// verify jwt
const verifyJwt = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorize' })

    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })

        }
        req.decoded = decoded;
        next()

    })

    

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.txpss.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db('genius-car').collection('services');
        const orderCollection = client.db('genius-car').collection('order');
        // authentication 
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            })
            res.send({ accessToken })

        })

        // get post all 
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })
        // get post by id

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await servicesCollection.findOne(query);
            res.send(service)

        })
        // post 
        app.post('/service', async (req, res) => {
            const service = req.body
            const result = await servicesCollection.insertOne(service)
            res.send(result)
        })
        // delete 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await servicesCollection.deleteOne(query)
            res.send(result)
        })
        //get order 
        app.get('/order', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (decodedEmail === email) {
                const query = { email: email }
                const cursor = orderCollection.find(query);
                const result = await cursor.toArray();
                res.send(result)

            }
            else{

                return res.status(403).send({ message: 'forbidden access' })
                
            }

        })
        //post order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })
    }
    finally {

    }

}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('running genius server')

})

app.listen(port, () => {
    console.log('listen port', port);
})