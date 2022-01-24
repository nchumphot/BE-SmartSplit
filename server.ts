import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect().then(() => {
  //Start the server on the given port
  const port = process.env.PORT;
  if (!port) {
    throw "Missing PORT environment variable.  Set it in .env file.";
  }
  app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
  });

  // app.get("/", async (req, res) => {
  //   const dbres = await client.query("select * from categories");
  //   res.json(dbres.rows);
  // });

  // GET /users
  app.get("/users", async (req, res) => {
    const query = "SELECT * FROM users;";
    const dbres = await client.query(query);
    res.status(200).json({
      status: "success",
      message: "All the users in the database.",
      data: dbres.rows,
    });
  });

  // POST /users
  app.post("/users", async (req, res) => {
    const { name, email } = req.body;
    const query1 = "SELECT * FROM users WHERE email = $1;";
    const dbres1 = await client.query(query1, [email]);
    if (dbres1.rowCount === 0) {
      // If the email has not been registered, add the user with the email provided.
      const query2 =
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *;";
      const dbres2 = await client.query(query2, [name, email]);
      res.status(201).json({
        status: "success",
        message: "A new user has been added.",
        data: dbres2.rows,
      });
    } else {
      // If the email has been registered, give an error message.
      res.status(406).json({
        status: "failed",
        message: "A user with the email address provided already exists.",
      });
    }
  });
});
