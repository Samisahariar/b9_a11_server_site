const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.DB_PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));



const uri = `mongodb+srv://${process.env.DB_MONGO_USER}:${process.env.DB_MONGO_PASSWORD}@cluster1.ikrjbas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("a11");
        const alljobs = database.collection("alljobs");
        const appliedjobs = database.collection("appliedJobs");

        //adding the applied jobs
        app.post("/appliedjobs", async(req, res) =>{
            const data = req.body;
            const result = await appliedjobs.insertOne(data);
            res.send(result)
        })



        //all job section
        app.post('/addjob', async(req, res) =>{
            const jobinfo = req.body;
            const result = await alljobs.insertOne(jobinfo);
            res.send(result)
        })

        app.get('/alljobs', async (req, res) =>{
            const cursor = alljobs.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/alljobs/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const cursor = await alljobs.findOne(query);
            res.send(cursor)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        /* await client.close(); */
    }
}
run().catch(console.dir);






app.get('/hello', (req, res) => {
    res.send("hellow world!!")
})

app.listen(port, () => {
    console.log(`port is runnig on ${port}`)
})
