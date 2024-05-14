const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.DB_PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');


app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_MONGO_USER}:${process.env.DB_MONGO_PASSWORD}@cluster1.ikrjbas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//middle-wares

const middlewares = async (req, res, next) => {
    console.log("hii form the middle wares")
    const token = req.cookies?.token;
    console.log(token)
    /* if (!token) {
        return res.status(403).send({ message: 'Not authorized User!' })
    };
    jwt.verify(token, process.env.DB_SECRET_TOKEN, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: "unauthorized User" })
        }
        req.user = decoded;
        next()
    }); */
}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("a11");
        const alljobs = database.collection("alljobs");
        const appliedjobs = database.collection("appliedJobs");

        //token are generates here
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.DB_SECRET_TOKEN, { expiresIn: '2h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                })
                .send({ success: true })
        });

        app.post('/logout', async (req, res) => {
            const loggedUser = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ message: "cookie clear successful" })
        })


        app.get("/appliedJobPage/:email", async (req, res) => {
            const email = req.params.email;
            const query = { applicant_email: email };
            const cursor = appliedjobs.find(query);
            const result = await cursor.toArray();
            res.send(result)

        })

        //adding the applied jobs
        app.put("/appliedjobs", async (req, res) => {
            const data = req.body
            const job_id = data.job_ID;
            const email = data.email;
            const resume = data.resume;
            const options = {
                projection: {
                    photo: 1,
                    jobtitle: 1,
                    salary: 1,
                    salary: 1,
                    deadline: 1,
                    applicantnumber: 1,
                    description: 1,
                    _id: 0
                }
            }
            const query = { _id: new ObjectId(job_id) };
            const cursor = await alljobs.findOne(query);
            if (cursor.email === email) {
                res.send({ message: "YOU ADDED THIS JOB SO YOU CANNOT APPLY!!!" })
            } else {
                const cursor = await alljobs.findOne(query, options);
                cursor.applicant_email = email;
                cursor.status = "applied";
                const result = await appliedjobs.insertOne(cursor);
                if (result.acknowledged) {
                    const updatedresult = await alljobs.updateOne(
                        query,
                        { $inc: { applicantnumber: +1 } });
                    res.send(updatedresult)
                } else {
                    res.send(result)
                }
            }
        })

        app.get("/appliedJobPage/sami", async (req, res) => {
            console.log("hiii")
            console.log(req.params.email)
            res.send({ message: "hiii" })
        })



        //my jobs
        app.get("/myjobs/:email", async (req, res) => {
            const email = req.params.email;
            /* if (req.user.email !== email) {
                res.send({ message: "unauthorized!" })
            } */
            const query = { email: { $eq: email } };
            const cursor = alljobs.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //all job section
        app.post('/addjob', async (req, res) => {
            const jobinfo = req.body;
            const result = await alljobs.insertOne(jobinfo);
            res.send(result)
        })

        app.get('/alljobs', async (req, res) => {
            const cursor = alljobs.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/alljobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
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
