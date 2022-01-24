import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { ITransaction } from "./interfaces/ITransaction";

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

  // POST /friends/:userId
  app.post("/friends/:userId", async (req, res) => {
    const { email } = req.body;
    const userId = parseInt(req.params.userId);
    const query1 = "SELECT id FROM users WHERE email = $1;";
    const dbres1 = await client.query(query1, [email]);
    const friendId = dbres1.rows[0].id;
    if (dbres1.rowCount === 0) {
      // If the friend is not registered, give an error message.
      res.status(404).json({
        status: "failed",
        message: "Cannot find a user with the email address provided.",
      });
    } else {
      // If the friend is registered, check if they are already friends.
      const query2 =
        "SELECT * FROM contact_list WHERE list_owner_id = $1 AND contact_id = $2;";
      const dbres2 = await client.query(query2, [userId, friendId]);
      if (dbres2.rowCount === 0) {
        // If they are not friends, add friend to the contact list.
        const query3 =
          "INSERT INTO contact_list (list_owner_id, contact_id) VALUES ($1, $2) RETURNING *;";
        const dbres3 = await client.query(query3, [userId, friendId]);
        res.status(201).json({
          status: "success",
          message: "A new friend has been added.",
          data: dbres3.rows,
        });
      } else {
        // If they are already friends, give an error message.
        res.status(406).json({
          status: "failed",
          message: "The user is already in your contact list.",
        });
      }
    }
  });

  // GET /users/:userId
  app.get("/users/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const query1 = "SELECT * FROM users WHERE id = $1;";
    const dbres1 = await client.query(query1, [userId]);
    if (dbres1.rowCount === 0) {
      // If a user is not found, give an error message.
      res.status(404).json({
        status: "failed",
        message: "User not found.",
      });
    } else {
      // If a user if found, perform relevant queries and return their results.
      const query2 =
        "SELECT users.* FROM contact_list JOIN users ON contact_list.contact_id = users.id WHERE list_owner_id = $1";
      const dbres2 = await client.query(query2, [userId]);
      const query3 =
        "SELECT transactions.lender_id, transactions.balance, users.name AS lender_name FROM transactions JOIN users ON transactions.lender_id = users.id WHERE borrower_id = $1;";
      const dbres3 = await client.query(query3, [userId]);
      const query4 =
        "SELECT transactions.borrower_id, transactions.balance, users.name AS borrower_name FROM transactions JOIN users ON transactions.borrower_id = users.id WHERE lender_id = $1;";
      const dbres4 = await client.query(query4, [userId]);
      res.status(200).json({
        status: "success",
        message: "Returns an array of friends, money borrowed and money lent.",
        data: {
          friends: dbres2.rows,
          moneyBorrowed: dbres3.rows,
          moneyLent: dbres4.rows,
        },
      });
    }
  });

  // GET /friends/:userId/:friendId
  app.get("/friends/:userId/:friendId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const friendId = parseInt(req.params.friendId);
    const query1 = "SELECT * FROM users WHERE id = $1";
    const dbres1 = await client.query(query1, [userId]);
    const dbres2 = await client.query(query1, [friendId]);
    if (dbres1.rowCount === 0) {
      // If the user does not exist, give an error.
      res.status(404).json({
        status: "failed",
        message: "User with the user ID provided does not exist.",
      });
    } else if (dbres2.rowCount === 0) {
      // If the friend does not exist, give an error.
      res.status(404).json({
        status: "failed",
        message: "Friend with the user ID provided does not exist.",
      });
    } else {
      // If both user and friend exist, return expenses involving them.
      const query2 =
        "SELECT transactions.id, expenses.description, expenses.transaction_date,transactions.balance FROM transactions JOIN expenses ON transactions.expense_id = expenses.id WHERE lender_id = $1 AND borrower_id = $2";
      const dbres3 = await client.query(query2, [friendId, userId]);
      const dbres4 = await client.query(query2, [userId, friendId]);
      res.status(200).json({
        status: "success",
        message: "Return how much the user owes the friend and vice versa.",
        data: {
          moneyBorrowed: dbres3.rows,
          moneyLent: dbres4.rows,
        },
      });
    }
  });

  // POST /expenses
  app.post<
    {},
    {},
    {
      userId: number;
      description: string;
      transactionDate: string;
      totalBalance: number;
      notes: string;
      transactions: ITransaction[];
    }
  >("/expenses", async (req, res) => {
    const { userId, description, transactionDate, totalBalance, transactions } =
      req.body;
    const notes = req.body.notes === "" ? null : req.body.notes;
    const query1 =
      "INSERT INTO expenses (user_id, description, transaction_date, total_balance, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *;";
    const dbres1 = await client.query(query1, [
      userId,
      description,
      transactionDate,
      totalBalance,
      notes,
    ]);
    const expenseId = dbres1.rows[0].id;
    const dbres2 = [];
    const query2 =
      "INSERT INTO transactions (expense_id, lender_id, borrower_id, balance) VALUES ($1, $2, $3, $4) RETURNING *;";
    for (const item of transactions) {
      const subDbres = await client.query(query2, [
        expenseId,
        item.lenderId,
        item.borrowerId,
        item.balance,
      ]);
      dbres2.push(subDbres.rows[0]);
    }
    res.status(201).json({
      status: "success",
      message:
        "A new expense has been created together with its corresponding transactions.",
      data: {
        expense: dbres1.rows,
        transactions: dbres2,
      },
    });
  });

  // GET /expenses/:expenseId
  app.get<{ expenseId: number }, {}, {}>(
    "/expenses/:expenseId",
    async (req, res) => {
      const { expenseId } = req.params;
      const query1 =
        "SELECT expenses.*, users.name as user_name FROM expenses JOIN users ON expenses.user_id = users.id WHERE expenses.id = $1";
      const dbres1 = await client.query(query1, [expenseId]);
      if (dbres1.rowCount === 0) {
        // If expense ID is not found, give an error.
        res.status(404).json({
          status: "failed",
          message: "Expense ID not found.",
        });
      } else {
        // If expense ID exist, query for its corresponding transactions.
        const query2 =
          "SELECT t1.*, users.name AS borrower_name FROM (SELECT transactions.*, users.name AS lender_name FROM transactions JOIN users ON transactions.lender_id = users.id WHERE expense_id = $1) AS t1 JOIN users on t1.borrower_id = users.id";
        const dbres2 = await client.query(query2, [expenseId]);
        res.status(200).json({
          status: "success",
          message:
            "Returns expense details with its corresponding transactions.",
          data: {
            expense: dbres1.rows,
            transactions: dbres2.rows,
          },
        });
      }
    }
  );

  // GET /comments/:expenseId
  app.get<{ expenseId: number }, {}, {}>(
    "/comments/:expenseId",
    async (req, res) => {
      const { expenseId } = req.params;
      const query1 = "SELECT * FROM expenses WHERE id = $1;";
      const dbres1 = await client.query(query1, [expenseId]);
      if (dbres1.rowCount === 0) {
        // If expense ID is not found, give an error.
        res.status(404).json({
          status: "failed",
          message: "Expense ID not found.",
        });
      } else {
        // If expense ID exist, return its comments.
        const query2 =
          "SELECT comments.*, users.name FROM comments JOIN users ON comments.user_id = users.id WHERE comments.expense_id = $1;";
        const dbres2 = await client.query(query2, [expenseId]);
        res.status(200).json({
          status: "success",
          message: "Returns comments of the expense.",
          data: dbres2.rows,
        });
      }
    }
  );

  // POST /comments/:expenseId
  app.post<{ expenseId: number }, {}, { userId: number; comment: string }>(
    "/comments/:expenseId",
    async (req, res) => {
      const { expenseId } = req.params;
      const query1 = "SELECT * FROM expenses WHERE id = $1;";
      const dbres1 = await client.query(query1, [expenseId]);
      if (dbres1.rowCount === 0) {
        // If expense ID is not found, give an error.
        res.status(404).json({
          status: "failed",
          message: "Expense ID not found.",
        });
      } else {
        // If expense ID exist, add a comment.
        const { userId, comment } = req.body;
        const query2 =
          "INSERT INTO comments (expense_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *;";
        const dbres2 = await client.query(query2, [expenseId, userId, comment]);
        res.status(201).json({
          status: "success",
          message: "Comment added successfully.",
          data: dbres2.rows,
        });
      }
    }
  );
});
