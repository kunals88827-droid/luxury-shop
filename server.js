const express = require("express");
const nodemailer = require("nodemailer");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use("/uploads", express.static("uploads"));

// 🔥 EMAIL SETUP (USE APP PASSWORD)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sonisingh991093@gmail.com",
    pass: "kaus zbur homa rngd"
  }
});

// ✅ Check email config
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ EMAIL ERROR:", error);
  } else {
    console.log("✅ EMAIL SERVER READY");
  }
});

// DB
const db = new sqlite3.Database("./database.db");

// TABLES
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price TEXT,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    address TEXT,
    cart TEXT,
    total TEXT
  )`);
});

// IMAGE UPLOAD
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// PRODUCTS
app.get("/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.post("/add-product", upload.single("image"), (req, res) => {
  const { name, price } = req.body;
  const image = req.file ? req.file.filename : "";

  db.run(
    "INSERT INTO products (name, price, image) VALUES (?,?,?)",
    [name, price, image],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Added" });
    }
  );
});

app.delete("/delete-product/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ msg: "Deleted" });
  });
});

// 🔥 PLACE ORDER + EMAIL
app.post("/place-order", (req, res) => {
  try {
    const { name, phone, address, cart, total } = req.body;

    if (!name || !phone) {
      return res.status(400).send("Missing data");
    }

    // ✅ Fix cart bug
    let parsedCart = typeof cart === "string" ? JSON.parse(cart) : cart;

    db.run(
      "INSERT INTO orders (name, phone, address, cart, total) VALUES (?,?,?,?,?)",
      [name, phone, address, JSON.stringify(parsedCart), total],
      function (err) {
        if (err) {
          console.log("DB ERROR:", err.message);
          return res.status(500).send("DB Error");
        }

        console.log("✅ ORDER SAVED");

        // 🔥 EMAIL
        const mailOptions = {
          from: "sonisingh991093@gmail.com",
          to: "sonisingh991093@gmail.com",
          subject: "🔥 New Order Received",
          text: `
🛒 New Order Received!

👤 Name: ${name}
📞 Phone: ${phone}
🏠 Address: ${address}

🧾 Items:
${parsedCart.map(i => `- ${i.name} (₹${i.price})`).join("\n")}

💰 Total: ₹${total}
          `
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.log("❌ EMAIL ERROR:", err);
          } else {
            console.log("📧 Email Sent:", info.response);
          }
        });

        res.send("OK");
      }
    );

  } catch (error) {
    console.log("❌ SERVER ERROR:", error);
    res.status(500).send("Server Error");
  }
});

// GET ORDERS
app.get("/orders", (req, res) => {
  db.all("SELECT * FROM orders", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});