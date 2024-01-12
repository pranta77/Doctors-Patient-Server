const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const objectId = require("mongodb").ObjectId;
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.slr2lcz.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("doctors_portal");
    const appointmentsCollection = database.collection("appointments");
    const usersCollection = database.collection("users");

    // get Appointments from database
    app.get("/appointments", async (req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.selected).toDateString();
      const query = { email: email, date: date };
      const cursor = appointmentsCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });

    app.get("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new objectId(id) };
      const result = await appointmentsCollection.findOne(query);
      res.json(result);
    });

    // insert Appointments to database
    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);
      res.json(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === " admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      console.log("put", user);
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // app.post("/create-payment-intent", async (req, res) => {
    //   const paymentInfo = req.body;
    //   const amount = paymentInfo.price * 100;
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     currency: "usd",
    //     amount: amount,
    //     automatic_payment_methods: {
    //       enabled: true,
    //     },
    //   });
    //   res.json({ clientSecret: paymentIntent.client_secret });
    // });

    /* app.post("/create-payment-intent", async (req, res) => {
      try {
        const paymentInfo = req.body;

        // Validate that 'price' is a valid number
        const price = parseFloat(paymentInfo.price);
        if (isNaN(price) || price <= 0) {
          throw new Error("Invalid price provided");
        }

        // Convert price to cents
        const amount = Math.round(price * 100);

        // Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          currency: "usd",
          amount: amount,
          automatic_payment_methods: {
            enabled: true,
          },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating Payment Intent:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }); */
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Doctors Portal !");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
