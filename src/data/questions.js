const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

// GET /api/questions
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

// GET /api/questions/:questionId
router.get("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json(question);
});

// POST /api/questions
router.post("/", async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required",
    });
  }

  const newQuestion = await prisma.question.create({
    data: {
      question,
      answer,
    },
  });

  res.status(201).json(newQuestion);
});

// PUT /api/questions/:questionId
router.put("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { question, answer } = req.body;

  try {
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        question,
        answer,
      },
    });

    res.json(updatedQuestion);
  } catch (error) {
    res.status(404).json({ message: "Question not found" });
  }
});

// DELETE /api/questions/:questionId
router.delete("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  try {
    const deleted = await prisma.question.delete({
      where: { id: questionId },
    });

    res.json({
      message: "Question deleted successfully",
      question: deleted,
    });
  } catch (error) {
    res.status(404).json({ message: "Question not found" });
  }
});

module.exports = router;