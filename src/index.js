const express = require("express");
const path = require("path");
const app = express();
const multer = require("multer");

const questionsRouter = require("./routes/questions");
const authRouter = require("./routes/auth");

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/questions", questionsRouter);
app.use("/api/auth", authRouter);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err?.message === "Only image files are allowed") {
    return res.status(400).json({ msg: err.message });
  }
  next(err);
});

app.use((req, res) => {
  res.status(404).json({ msg: "Not found" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});