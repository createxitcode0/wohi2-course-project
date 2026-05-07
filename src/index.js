const express = require("express");
const path = require("path");

const app = express();

const questionsRouter = require("./routes/questions");
const authRouter = require("./routes/auth");

console.log("__dirname:", __dirname);

app.use(express.json());

const publicPath = path.join(__dirname, "..", "public");

app.use(express.static(publicPath));
app.use("/api/questions", questionsRouter);
app.use("/api/auth", authRouter);
app.use((req, res) => {
  res.status(404).json({ msg: "Not found" });
});
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

console.log("ABOUT TO START SERVER");