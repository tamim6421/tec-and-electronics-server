

const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const SSLCommerzPayment = require('sslcommerz-lts')
const port= process.env.PORT || 5000



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

const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = false //true for live, false for sandbox


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    

    const productCollection = client.db("productDB").collection("products")
    const addToCart = client.db("productDB").collection("cartCollection")
    const userCollection = client.db("productDB").collection("userCollection")
    const orderCollection = client.db("productDB").collection("orderCollection")
    

    // post payment information 
app.post('/order', async(req, res) =>{
  const product = await addToCart.findOne({_id: new ObjectId(req.body.productId)})
  // console.log(product)

  const tran_id = new ObjectId().toString()
  const order = req.body
  const data = {
    total_amount: parseFloat(product.price),
    currency: 'BDT',
    tran_id: tran_id, // use unique tran_id for each api call
    success_url: `http://localhost:5000/payment/success/${tran_id}`,
    fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
    cancel_url: 'http://localhost:3030/cancel',
    ipn_url: 'http://localhost:3030/ipn',
    shipping_method: 'Courier',
    product_name: 'Computer.',
    product_category: 'Electronic',
    product_profile: 'general',
    cus_name: order.name,
    cus_email: order.userEmail,
    cus_add1: 'Dhaka',
    cus_add2: 'Dhaka',
    cus_city: 'Dhaka',
    cus_state: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: '01711111111',
    cus_fax: '01711111111',
    ship_name: 'Customer Name',
    ship_add1: 'Dhaka',
    ship_add2: 'Dhaka',
    ship_city: 'Dhaka',
    ship_state: 'Dhaka',
    ship_postcode: 1000,
    ship_country: 'Bangladesh',
};

console.log(data)

const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
sslcz.init(data).then(apiResponse => {
    // Redirect the user to payment gateway
    let GatewayPageURL = apiResponse.GatewayPageURL;
    res.send({url:GatewayPageURL})

    const finalOrder = {
      product,
      paidStatus: false,
      tranjectionId: tran_id,

    }
    const result =  orderCollection.insertOne(finalOrder)
    console.log('Redirecting to: ', GatewayPageURL)
});

// payment success Post 
app.post("/payment/success/:tranId", async(req, res) => {
  console.log(req.params.tranId)
  const result = await orderCollection.updateOne({ tranjectionId:req.params.tranId },{
    $set:{
      paidStatus: true,
    }
  })
  if(result.modifiedCount > 0){
    res.redirect(`http://localhost:5173/payment/success/${req.params.tranId}`)
  }
 
})


// payment failed post 
app.post('/payment/fail/:tranId', async( req, res) =>{
  const result = await orderCollection.deleteOne({ tranjectionId:req.params.tranId })
  if(result.deletedCount ){
    res.redirect(`http://localhost:5173/payment/fail/${req.params.tranId}`)
  }
})


})



 
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
      // console(users)
      delete users._id
      // console.log(users)
      const result = await addToCart.insertOne(users)
      res.send(result)
    })

    // read the data 
    app.get('/carts', async(req, res) =>{
      const cursor = addToCart.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.delete('/carts/:id', async(req, res) =>{
      const id = req.params.id 
      console.log('delete id', id)
      const query = {_id: new ObjectId(id)}
      const result = await addToCart.deleteOne(query)
      res.send(result)
    })


    



    // users information post 
    // app.post('/users', async(req, res) =>{
    //   const newUser = req.body
    //   console.log(newUser)
    //   const result = await userCollection.insertOne(newUser)
    //   res.send(result)
    // })

 // read the data of users
    // app.get('/users', async(req, res) =>{
    //   const cursor = userCollection.find()
    //   const result = await cursor.toArray()
    //   res.send(result)
    // })



    // Send a ping to confirm a successful connection
 
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