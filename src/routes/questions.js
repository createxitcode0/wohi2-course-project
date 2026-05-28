const express = require("express");
const router = express.Router();
const { z } = require("zod");
const multer = require("multer");
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");
const upload = require("../middleware/upload");
const { NotFoundError, ValidationError } = require("../lib/errors");
const Groq = require("groq-sdk");


const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const QuestionInput = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  keywords: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

function parseKeywords(keywords) {
  if (Array.isArray(keywords)) return keywords;
  if (typeof keywords === "string") {
    return keywords.split(",").map((k) => k.trim()).filter(Boolean);
  }
  return [];
}

function formatQuestion(q) {
  return {
    ...q,
    keywords: q.keywords ? q.keywords.map((k) => k.name) : [],
    userName: q.user?.name || null,
    likeCount: q._count?.likes ?? 0,
    imageUrl: q.imageUrl || null,
    liked: q.likes ? q.likes.length > 0 : false,
    solved: q.attempts ? q.attempts.length > 0 : false,
    user: undefined,
    likes: undefined,
    _count: undefined,
    attempts: undefined,
  };
}

const questionInclude = (userId) => ({
  keywords: true,
  user: true,
  likes: { where: { userId }, take: 1 },
  _count: { select: { likes: true } },
  attempts: { where: { userId, correct: true }, take: 1 },
});

/* GET /api/questions */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { keyword, difficulty } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    const where = {};
    if (keyword) {
      where.keywords = { some: { name: keyword.toLowerCase() } };
    }
    if (difficulty && VALID_DIFFICULTIES.includes(difficulty)) {
      where.difficulty = difficulty;
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: questionInclude(req.user.userId),
        orderBy: { id: "asc" },
        skip,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      data: questions.map(formatQuestion),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

/* GET /api/questions/leaderboard */
router.get("/leaderboard", authenticate, async (req, res, next) => {
  try {
    const leaderboard = await prisma.attempt.groupBy({
      by: ["userId"],
      where: { correct: true },
      _count: { correct: true },
      orderBy: { _count: { correct: "desc" } },
      take: 5,
    });

    const userIds = leaderboard.map((entry) => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    const result = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: userMap[entry.userId] || "Unknown",
      correctAnswers: entry._count.correct,
    }));

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* GET /api/questions/quiz/random */
router.get("/quiz/random", authenticate, async (req, res, next) => {
  try {
    const { difficulty } = req.query;

    const where = {};
    if (difficulty && VALID_DIFFICULTIES.includes(difficulty)) {
      where.difficulty = difficulty;
    }

    const total = await prisma.question.count({ where });
    const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 10)));

    const questions = await prisma.question.findMany({
      where,
      include: questionInclude(req.user.userId),
      take: 10,
      skip,
      orderBy: { id: "asc" },
    });

    res.json({ data: questions.map(formatQuestion) });
  } catch (err) {
    next(err);
  }
});



/* GET /api/questions/:questionId */
router.get("/:questionId", authenticate, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: questionInclude(req.user.userId),
    });

    if (!question) {
      req.log.warn({ questionId }, "user tried to access nonexistent question");
      throw new NotFoundError("Question not found");
    }

    res.json(formatQuestion(question));
  } catch (err) {
    next(err);
  }
});

/* POST /api/questions */
router.post("/", authenticate, upload.single("image"), async (req, res, next) => {
  try {
    const data = QuestionInput.parse(req.body);
    const keywordsArray = parseKeywords(data.keywords);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newQuestion = await prisma.question.create({
      data: {
        question: data.question,
        answer: data.answer,
        imageUrl,
        difficulty: data.difficulty ?? "medium",
        userId: req.user.userId,
        keywords: {
          connectOrCreate: keywordsArray.map((kw) => ({
            where: { name: kw.toLowerCase() },
            create: { name: kw.toLowerCase() },
          })),
        },
      },
      include: questionInclude(req.user.userId),
    });

    res.status(201).json(formatQuestion(newQuestion));
  } catch (err) {
    next(err);
  }
});

/* PUT /api/questions/:questionId */
router.put("/:questionId", authenticate, upload.single("image"), isOwner, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const data = QuestionInput.parse(req.body);
    const keywordsArray = parseKeywords(data.keywords);

    const updateData = {
      question: data.question,
      answer: data.answer,
      keywords: {
        set: [],
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw.toLowerCase() },
          create: { name: kw.toLowerCase() },
        })),
      },
    };

    if (data.difficulty) {
      updateData.difficulty = data.difficulty;
    }

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
      include: questionInclude(req.user.userId),
    });

    res.json(formatQuestion(updated));
  } catch (err) {
    next(err);
  }
});

/* DELETE /api/questions/:questionId */
router.delete("/:questionId", authenticate, isOwner, async (req, res, next) => {
  try {
    await prisma.question.delete({
      where: { id: Number(req.params.questionId) },
    });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
});

/* POST /api/questions/:questionId/like */
router.post("/:questionId/like", authenticate, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      req.log.warn({ questionId }, "user tried to like nonexistent question");
      throw new NotFoundError("Question not found");
    }

    const like = await prisma.like.upsert({
      where: { userId_questionId: { userId: req.user.userId, questionId } },
      update: {},
      create: { userId: req.user.userId, questionId },
    });

    const likeCount = await prisma.like.count({ where: { questionId } });
    res.status(201).json({ id: like.id, questionId, liked: true, likeCount, createdAt: like.createdAt });
  } catch (err) {
    next(err);
  }
});

/* DELETE /api/questions/:questionId/like */
router.delete("/:questionId/like", authenticate, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      req.log.warn({ questionId }, "user tried to unlike nonexistent question");
      throw new NotFoundError("Question not found");
    }

    await prisma.like.deleteMany({ where: { userId: req.user.userId, questionId } });
    const likeCount = await prisma.like.count({ where: { questionId } });
    res.json({ questionId, liked: false, likeCount });
  } catch (err) {
    next(err);
  }
});

/* POST /api/questions/:questionId/play */
router.post("/:questionId/play", authenticate, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    const { answer } = req.body;

    if (!answer) throw new ValidationError("Answer is required");

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      req.log.warn({ questionId }, "user tried to play nonexistent question");
      throw new NotFoundError("Question not found");
    }

    const correct =
      question.answer.trim().toLowerCase() === answer.trim().toLowerCase();

    const attempt = await prisma.attempt.create({
      data: { userId: req.user.userId, questionId, submittedAnswer: answer, correct },
    });

    res.json({
      id: attempt.id,
      correct,
      submittedAnswer: answer,
      correctAnswer: question.answer,
      createdAt: attempt.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/* POST /api/questions/generate */
router.post("/generate", authenticate, async (req, res, next) => {
  try {
    const { topic, difficulty = "medium", count = 5 } = req.body;

    if (!topic) throw new ValidationError("topic is required");

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Generate ${count} quiz questions about "${topic}" with difficulty level "${difficulty}".
    Return ONLY a JSON array with no markdown, no backticks, no explanation.
    Each object must have exactly these fields:
   - "question": string
   - "answer": string
   - "keywords": array of strings
   - "difficulty": "${difficulty}"

    Example format:
    [{"question":"...","answer":"...","keywords":["..."],"difficulty":"${difficulty}"}]`;

    const completion = await groq.chat.completions.create({
     messages: [{ role: "user", content: prompt }],
     model: "llama-3.3-70b-versatile",
    });
    const text = completion.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const generated = JSON.parse(clean);

    const saved = await Promise.all(
      generated.map((q) =>
        prisma.question.create({
          data: {
            question: q.question,
            answer: q.answer,
            difficulty: q.difficulty ?? difficulty,
            userId: req.user.userId,
            keywords: {
              connectOrCreate: (q.keywords || []).map((kw) => ({
                where: { name: kw.toLowerCase() },
                create: { name: kw.toLowerCase() },
              })),
            },
          },
          include: questionInclude(req.user.userId),
        })
      )
    );

    res.status(201).json({ data: saved.map(formatQuestion) });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err?.message === "Only image files are allowed") {
    return res.status(400).json({ msg: err.message });
  }
  next(err);
});

module.exports = router;