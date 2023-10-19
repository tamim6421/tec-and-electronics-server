

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
require('dotenv').config()
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000 


// here I used to middleware 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.iimwc2a.mongodb.net/?retryWrites=true&w=majority`;

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

    const productCollection = client.db("productDB").collection("products")
    const addToCart = client.db("productDB").collection("cartCollection")
 
    // post product in database
    app.post('/products', async(req, res) =>{
        const users = req.body 
        console.log(users)
        const result = await productCollection.insertOne(users)
        res.send(result)
    } )

    // read data from database 
    app.get('/products', async(req, res) =>{
        const query = productCollection.find()
        const result = await query.toArray()
        res.send(result)
    })

    

    // use get operation to get data for update data 
    app.get('/products/:id', async(req, res) =>{
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const result = await productCollection.findOne(query)
        res.send(result)
    })


    // put operation for update 
    app.put('/products/:id', async(req, res) =>{
        const id = req.params.id 
        const product = req.body
        const filter = {_id: new ObjectId(id)}
        const options = { upsert: true };
        const updateProduct ={
            $set:{
                name:product.name,
                 bName:product.bName,
                 photo:product.photo,
                 type:product.type,
                 price:product.price,
                 description:product.description,
                 rating:product.rating

            }
        }
        const result = await productCollection.updateOne(filter, updateProduct, options)
        res.send(result)
    })


    // added add to cart data to the database 
    app.post('/carts', async (req, res) =>{
      const users = req.body 
      console.log(users)
      const result = await addToCart.insertOne(users)
      res.send(result)
    })



    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('DIGITAL SHOP')
})
app.listen(port, () =>{
    console.log(`app is running on port: ${port}`)
})