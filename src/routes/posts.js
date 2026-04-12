const express = require("express");
const Router = express.Router();

const posts = require("../data/posts");

// GET /api/posts
// List all posts (with optional search)
router.get("/", (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.json(posts);
  }

  const filteredPosts = posts.filter(post =>
    post.question.toLowerCase().includes(keyword.toLowerCase())
  );

  res.json(filteredPosts);
});

// GET /api/posts/:postId
// Show a specific post
router.get("/:postId", (req, res) => {
  const postId = Number(req.params.postId);

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  res.json(post);
});

module.exports = router;

const express = require("express");
const router = express.Router();

const posts = require("../data/posts");


// GET /api/posts (search)
router.get("/", (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.json(posts);
  }

  const filteredPosts = posts.filter(post =>
    post.question.toLowerCase().includes(keyword.toLowerCase())
  );

  res.json(filteredPosts);
});


// GET /api/posts/:postId
router.get("/:postId", (req, res) => {
  const postId = Number(req.params.postId);

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  res.json(post);
});


// POST /api/posts (create)
router.post("/", (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required"
    });
  }

  const maxId = Math.max(...posts.map(p => p.id), 0);

  const newPost = {
    id: maxId + 1,
    question,
    answer
  };

  posts.push(newPost);

  res.status(201).json(newPost);
});


// PUT /api/posts/:postId (update)
router.put("/:postId", (req, res) => {
  const postId = Number(req.params.postId);
  const { question, answer } = req.body;

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required"
    });
  }

  post.question = question;
  post.answer = answer;

  res.json(post);
});


// DELETE /api/posts/:postId
router.delete("/:postId", (req, res) => {
  const postId = Number(req.params.postId);

  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ message: "Post not found" });
  }

  const deletedPost = posts.splice(postIndex, 1);

  res.json({
    message: "Post deleted successfully",
    post: deletedPost[0]
  });
});

module.exports = router;