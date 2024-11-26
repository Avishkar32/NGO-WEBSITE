import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connect, disconnect } from "./db.js"; // Importing the connect and disconnect functions
import session from "express-session"; // Importing express-session
import routes from "./routes.js"; // Importing the routes

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: "your_secret_key", // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Use routes
app.use("/", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!"); // Generic error message
});

// Start the server and connect to the database
app.listen(port, async () => {
  try {
    await connect(); // Connect to the database
    console.log(`Listening on port ${port}`);
  } catch (error) {
    console.error("Database connection failed:", error); // Log connection error
    process.exit(1); // Exit if database connection fails
  }
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log("Gracefully shutting down...");
  await disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
