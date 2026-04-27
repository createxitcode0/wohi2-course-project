const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

function formatQuestion(q) {
  return {
    ...q,
    keywords: q.keywords ? q.keywords.map((k) => k.name) : [],
  };
}

// GET /api/questions
router.get("/", async (req, res) => {
  const { keyword } = req.query;

  const where = keyword
    ? {
        keywords: {
          some: {
            name: keyword.toLowerCase(),
          },
        },
      }
    : {};

  const questions = await prisma.question.findMany({
    where,
    include: { keywords: true },
    orderBy: { id: "asc" },
  });

  res.json(questions.map(formatQuestion));
});

// GET /api/questions/:questionId
router.get("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { keywords: true },
  });

  if (!question) {
    return res.status(404).json({
      message: "Question not found",
    });
  }

  res.json(formatQuestion(question));
});

// POST /api/questions
router.post("/", authenticate, async (req, res) => {
  const { question, answer, keywords } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required",
    });
  }

  const keywordsArray = Array.isArray(keywords) ? keywords : [];

  const newQuestion = await prisma.question.create({
    data: {
      question,
      answer,
      userId: req.user.userId,  
      keywords: {
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw.toLowerCase() },
          create: { name: kw.toLowerCase() },
        })),
      },
    },
    include: { keywords: true },
  });

  res.status(201).json(formatQuestion(newQuestion));
});

// PUT /api/questions/:questionId
router.put("/:questionId", authenticate, isOwner, async (req, res) => {
  const { question, answer, keywords } = req.body;

  const updated = await prisma.question.update({
    where: { id: Number(req.params.questionId) },
    data: {
      question,
      answer,
      keywords: {
        set: [],
        connectOrCreate: (keywords || []).map((kw) => ({
          where: { name: kw.toLowerCase() },
          create: { name: kw.toLowerCase() },
        })),
      },
    },
    include: { keywords: true },
  });

  res.json(updated);
});

// DELETE /api/questions/:questionId
router.delete("/:questionId", authenticate, isOwner, async (req, res) => {
  await prisma.question.delete({
    where: { id: Number(req.params.questionId) },
  });

  res.json({ message: "Deleted successfully" });
});


module.exports = router;