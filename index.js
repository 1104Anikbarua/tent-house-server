const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(express.json())
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qmtwhbg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    // console.log('inside verifyjwt', authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden user' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
        await client.connect();
        const essentialCollection = client.db('essentialProduct').collection('store');

        // verify user
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            // console.log(accessToken)
            res.send({ accessToken })
        })

        // load 6items data 
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = essentialCollection.find(query).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });


        // load all data 
        app.get('/allproduct', async (req, res) => {
            const query = {};
            const cursor = essentialCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        // load data using id 
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await essentialCollection.findOne(query);
            res.send(result)
        });

        // update quantity
        app.put('/product/:id', async (req, res) => {
            // console.log(req)
            const id = req.params.id;
            // console.log(id)
            const testQuantity = req.body;
            // console.log(testQuantity)
            const query = { _id: ObjectId(id) };
            // console.log(query)

            const options = { upsert: true };
            const updatedDoc = {
                $set: { quantity: testQuantity.newQuantity }
            }

            const result = await essentialCollection.updateOne(query, updatedDoc, options);
            res.send(result)
        });

        // deliver quantity
        app.patch('/delivered/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const deliveredQuantity = req.body;
            // console.log(deliveredQuantity)
            const query = { _id: ObjectId(id) };
            // console.log(query)
            const options = { upsert: true };
            const updatedDoc = {
                $set: { quantity: deliveredQuantity.newQuantity }
            }

            const result = await essentialCollection.updateOne(query, updatedDoc, options);
            res.send(result)
        });
        // manage remove
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await essentialCollection.deleteOne(query);
            res.send(result)
        });

        // add items 
        app.post('/additems', async (req, res) => {
            const newItems = req.body;
            const result = await essentialCollection.insertOne(newItems)
            res.send(result)
        });

        // find product based on user email
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            // console.log(email);
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = essentialCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }

        });
        // delete user product based on email 
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await essentialCollection.deleteOne(query);
            res.send(result)
        });


    }
    finally {
        // await client.close();
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
    console.log('running without error looking good')
});

app.listen(port, () => {
    console.log(`listening on port ${port}`)
});
