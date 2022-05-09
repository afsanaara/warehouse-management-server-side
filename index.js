const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();

//middleware


app.use(cors());
app.use(express.json());

var jwt = require('jsonwebtoken');


const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h62pt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
    await client.connect();
    console.log("Connected");
    const foodCollection = client.db('gopanda').collection('foods');
    const myCollection = client.db('gopanda').collection('selectedItems');
        
    //JWT Authentication
      app.post("/user", (req, res) => {
        const email = req.body;
        const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
        res.send({token: token});
    })
        // ADD ITEMS
      app.post("/additem", async(req, res)=> {
        const product = req.body;
        console.log(product);
        const token = req.headers.authorization;
        const [email, accessToken] = token.split(" ");
        console.log(email);
        var decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (email === decoded.email) {
            const result = await foodCollection.insertOne(product);
          res.send(result);
        }
        else {
          res.send({success: "unauthorized"})
        }
        
        
      })
    
    //delete items
        app.delete("/additem/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await foodCollection.deleteOne(filter);
            res.send(result);
        })
    
    //READ ALL THE PRODUCT
    app.get("/products", async (req, res) => {
      const result = await foodCollection.find({}).toArray();
      res.send(result);
    })

    //READ SPECIFIC PRODUCT
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    //UPDATE PRODUCT QUANTITY
    app.put("/products/:id", async (req, res) => {
      const newQuantity = { quantity: Number(req.body.quantity) }
      console.log(newQuantity);
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
      $set: {
                    ...newQuantity
        
      },
            };
            const result = await foodCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

   //MY ITEMS
    
    
    app.post("/myitems", async (req, res) => {
      const info = req.body;
      
      const result = await myCollection.insertOne(info);
      res.send({success:"added to my items"});
    })

    app.delete("/myitems/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await myCollection.deleteOne(filter);
            res.send(result);
        })

    app.get("/selecteditems", async (req, res) => {
      const token = req.headers.authorization;
        const [email, accessToken] = token.split(" ");
        var decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (email === decoded.email) {
             const result = await myCollection.find({email:email}).toArray();
             res.send(result);
        }
        else {
          res.send({success: "unauthorized"})
        }
      
    })
    }
    finally{

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })