import express from "express";
import { pool } from "./db.js";
import multer from "multer";
import session from "express-session";
import env from "dotenv";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
env.config();
const saltRounds = 10;

router.use(
  session({
    secret: "Suraj126708",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

router.use(express.urlencoded({ extended: true }));
router.use(express.static("public"));

router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

router.use(passport.initialize());
router.use(passport.session());

// Passport configuration
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// Define routes
router.get("/", (req, res) => res.render("index2"));
router.get("/rewards", (req, res) => res.render("rewards"));
router.get("/ngo-login", (req, res) => res.render("login_register/ngo_login"));
router.get("/user-login", (req, res) =>
  res.render("login_register/user_login")
);
router.get("/register-user", (req, res) =>
  res.render("login_register/user-register")
);
router.get("/verification", (req, res) =>
  res.render("login_register/user-otp-verification")
);
router.get("/ngo-user", (req, res) =>
  res.render("login_register/user-register")
);
router.get("/complete-registration", (req, res) => res.render("index"));
router.get("/ngo-register", (req, res) =>
  res.render("login_register/ngo-register")
);
router.get("/donate2", (req, res) => res.render("donate/donate2"));
router.get("/contact", (req, res) => res.render("contact"));
router.get("/about", (req, res) => res.render("about"));
router.get("/user", (req, res) => res.render("acount"));
router.get("/donate", (req, res) => res.render("donate/donate1"));

router.get("/submit-info", (req, res) => {
  const { donationId } = req.query;
  res.render("donate/donate2", { donationId });
});

router.get("/donated", (req, res) => {
  const { donationId } = req.query;
  res.render("donate/donate3", { donationId });
});

router.post("/submit-donation", async (req, res) => {
  const {
    books = 0,
    clothes = 0,
    grains = 0,
    footwear = 0,
    toys = 0,
    schoolSupplies = 0,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO donations (books, clothes, grains, footwear, toys, schoolSupplies) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [books, clothes, grains, footwear, toys, schoolSupplies]
    );
    const donationId = result.rows[0].id;
    res.redirect(`/submit-info?donationId=${donationId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/submit-info", async (req, res) => {
  const {
    donationId,
    fname,
    lname,
    email,
    phone,
    phone2,
    flat,
    addline,
    land,
    city,
    state,
    pincode,
    optnote,
  } = req.body;

  try {
    await pool.query(
      `UPDATE donations SET fname = $1, lname = $2, email = $3, phone = $4, phone2 = $5, flat = $6, addline = $7, land = $8, city = $9, state = $10, pincode = $11, optnote = $12 WHERE id = $13`,
      [
        fname,
        lname,
        email,
        phone,
        phone2,
        flat,
        addline,
        land,
        city,
        state,
        pincode,
        optnote,
        donationId,
      ]
    );
    res.redirect(`/donated?donationId=${donationId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/donated", async (req, res) => {
  const { date, time, donationId } = req.body;

  try {
    await pool.query(
      `UPDATE donations SET pickup_date = $1, pickup_time = $2 WHERE id = $3`,
      [date, time, donationId]
    );
    res.render("index2");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Authentication routes
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      if (req.xhr || req.headers.accept.indexOf("json") > -1) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid credentials" });
      } else {
        return res.redirect("/login");
      }
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      if (req.xhr || req.headers.accept.indexOf("json") > -1) {
        return res.json({ status: "success", redirect: "/index" });
      } else {
        return res.redirect("/index");
      }
    });
  })(req, res, next);
});

router.post("/ngo-register", upload.single("file"), async (req, res) => {
  const {
    name,
    registration_number,
    email,
    phone,
    phone2,
    addline,
    land,
    city,
    state,
    pincode,
    optnote,
    url,
    socialsurl,
    terms,
  } = req.body;

  const registration_certificate = req.file;

  if (!registration_certificate) {
    return res.status(400).send("File upload failed");
  }

  try {
    const query = `
      INSERT INTO ngo_register (
        ngo_name,
        registration_number,
        email,
        primary_phone,
        alternate_phone,
        address,
        landmark,
        city,
        state,
        pincode,
        description,
        website_url,
        social_handle_url,
        registration_certificate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    await pool.query(query, [
      name,
      registration_number,
      email,
      phone,
      phone2,
      addline,
      land,
      city,
      state,
      pincode,
      optnote,
      url,
      socialsurl,
      registration_certificate.buffer,
    ]);
    res.render("index");
  } catch (err) {
    console.error("Error saving NGO to database:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/register-user", async (req, res) => {
  const { Fullname, phone, email, password } = req.body;
  try {
    const currentTime = new Date().toISOString();

    const checkResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkResult.rows.length > 0) {
      return res.redirect("/login");
    } else {
      const hash = await bcrypt.hash(password, saltRounds);
      await pool.query(
        "INSERT INTO users (fullname, phone, email, password, date) VALUES ($1, $2, $3, $4, $5)",
        [Fullname, phone, email, hash, currentTime]
      );
      return res.redirect("/login_register/user-otp-verification");
    }
  } catch (err) {
    console.error("Error saving user to database:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/ngo-login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = "SELECT * FROM ngo_register WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length > 0) {
      const ngo = result.rows[0];
      if (ngo.registration_number === password) {
        res.render("index");
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } else {
      res.status(404).json({ message: "NGO not found" });
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Passport Strategy
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        return cb(null, valid ? user : false);
      } else {
        return cb(null, false);
      }
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  })
);

export default router;
