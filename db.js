import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Ngo_website",
  password: "Suraj@#6708",
  port: 5432,
});

// Method to connect to the database
const connect = async () => {
  try {
    await pool.connect();
    console.log("Connected to the database");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
};

// Method to disconnect from the database
const disconnect = async () => {
  try {
    await pool.end();
    console.log("Disconnected from the database");
  } catch (err) {
    console.error("Error disconnecting from the database:", err);
  }
};

export { pool, connect, disconnect };
