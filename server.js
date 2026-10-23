const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-demo-secret-before-deployment";
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { users: [], tasks: [], nextTaskId: 1 };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function seedDemoUser() {
  const data = readData();
  const email = "student@example.com";
  const exists = data.users.some(u => u.email === email);
  if (!exists) {
    const passwordHash = await bcrypt.hash("password123", 10);
    data.users.push({
      id: 1,
      email,
      name: "Student",
      passwordHash
    });
    writeData(data);
  }
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Please log in." });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

// POST /api/login
app.post("/api/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const data = readData();
  const user = data.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Wrong email or password." });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

// GET /api/tasks
app.get("/api/tasks", auth, (req, res) => {
  const data = readData();
  res.json(data.tasks.filter(t => t.userId === req.user.id));
});

// POST /api/tasks
app.post("/api/tasks", auth, (req, res) => {
  const title = String(req.body.title || "").trim();
  const priority = req.body.priority;
  if (title.length < 3) {
    return res.status(400).json({ error: "Task title must be at least 3 characters." });
  }
  if (!["low", "medium", "high"].includes(priority)) {
    return res.status(400).json({ error: "Choose a valid priority." });
  }

  const data = readData();
  const task = {
    id: data.nextTaskId++,
    userId: req.user.id,
    title,
    priority,
    done: false
  };
  data.tasks.unshift(task);
  writeData(data);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
app.put("/api/tasks/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const task = data.tasks.find(t => t.id === id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ error: "Task not found." });

  if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
    const title = String(req.body.title || "").trim();
    if (title.length < 3) return res.status(400).json({ error: "Title must be at least 3 characters." });
    task.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "done")) {
    if (typeof req.body.done !== "boolean") return res.status(400).json({ error: "Done must be true or false." });
    task.done = req.body.done;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "priority")) {
    if (!["low", "medium", "high"].includes(req.body.priority)) {
      return res.status(400).json({ error: "Choose a valid priority." });
    }
    task.priority = req.body.priority;
  }

  writeData(data);
  res.json(task);
});

// DELETE /api/tasks/:id
app.delete("/api/tasks/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const index = data.tasks.findIndex(t => t.id === id && t.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: "Task not found." });

  data.tasks.splice(index, 1);
  writeData(data);
  res.json({ message: "Task deleted." });
});

// DELETE /api/tasks?completed=true
app.delete("/api/tasks", auth, (req, res) => {
  const data = readData();
  const before = data.tasks.length;
  data.tasks = data.tasks.filter(t => !(t.userId === req.user.id && t.done));
  writeData(data);
  res.json({ deleted: before - data.tasks.length });
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

seedDemoUser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`To-Do app running at http://localhost:${PORT}`);
      console.log("Demo login: student@example.com / password123");
    });
  })
  .catch(err => {
    console.error("Could not initialize demo user:", err);
    process.exit(1);
  });
