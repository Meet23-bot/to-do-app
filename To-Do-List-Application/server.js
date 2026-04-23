const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const packageJson = require("./package.json");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const TASKS_FILE = path.resolve(__dirname, process.env.TASKS_FILE || "tasks.json");
const APP_NAME = process.env.APP_NAME || packageJson.name;

app.use(express.json());
app.use(express.static(__dirname));

async function ensureTasksFile() {
  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.writeFile(TASKS_FILE, "[]", "utf-8");
  }
}

async function readTasks() {
  await ensureTasksFile();
  const raw = await fs.readFile(TASKS_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeTasks(tasks) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: APP_NAME,
    version: packageJson.version,
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/tasks", async (_req, res) => {
  const tasks = await readTasks();
  res.json(tasks);
});

app.post("/api/tasks", async (req, res) => {
  const { text, description = "", dueDate = "", priority = "Low", completed = false } = req.body || {};

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Task text is required." });
  }

  const tasks = await readTasks();
  const newTask = {
    id: crypto.randomUUID(),
    text: text.trim(),
    description: String(description || "").trim(),
    createdAt: new Date().toISOString(),
    dueDate: String(dueDate || "").trim(),
    priority: String(priority || "Low"),
    completed: Boolean(completed),
  };

  tasks.push(newTask);
  await writeTasks(tasks);
  return res.status(201).json(newTask);
});

app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  const current = tasks[index];
  const updates = req.body || {};
  const updatedTask = {
    ...current,
    text: typeof updates.text === "string" ? updates.text.trim() : current.text,
    description:
      typeof updates.description === "string"
        ? updates.description.trim()
        : current.description,
    dueDate: typeof updates.dueDate === "string" ? updates.dueDate.trim() : current.dueDate,
    priority: typeof updates.priority === "string" ? updates.priority : current.priority,
    completed: typeof updates.completed === "boolean" ? updates.completed : current.completed,
  };

  if (!updatedTask.text) {
    return res.status(400).json({ error: "Task text is required." });
  }

  tasks[index] = updatedTask;
  await writeTasks(tasks);
  return res.json(updatedTask);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const tasks = await readTasks();
  const nextTasks = tasks.filter((task) => task.id !== id);

  if (nextTasks.length === tasks.length) {
    return res.status(404).json({ error: "Task not found." });
  }

  await writeTasks(nextTasks);
  return res.status(204).send();
});

app.delete("/api/tasks", async (_req, res) => {
  await writeTasks([]);
  res.status(204).send();
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const server = app.listen(PORT, async () => {
  await ensureTasksFile();
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`Using task file: ${TASKS_FILE}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down server...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
