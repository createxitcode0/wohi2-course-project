const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

// GET /questions (with optional keyword search)
router.get("/", async (req, res) => {
  const { keyword } = req.query;

  const where = keyword
    ? {
        question: {
          contains: keyword,
        },
      }
    : {};

  const questions = await prisma.question.findMany({
    where,
    orderBy: { id: "asc" },
  });

  res.json(questions);
});

module.exports = router;