const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

async function resetDb() {
  await prisma.attempt.deleteMany();
  await prisma.like.deleteMany();
  await prisma.question.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.user.deleteMany();
}

async function registerAndLogin(email = "a@test.io", name = "A") {
  await request(app).post("/api/auth/register")
    .send({ email, password: "pw12345", name });
  const res = await request(app).post("/api/auth/login")
    .send({ email, password: "pw12345" });
  return res.body.token;
}

async function createQuestion(token, overrides = {}) {
  const { question = "Q", answer = "A", keywords } = overrides;
  const req = request(app).post("/api/questions")
    .set("Authorization", `Bearer ${token}`)
    .field("question", question)
    .field("answer", answer);
  if (keywords) req.field("keywords", keywords);
  const res = await req;
  return res.body;
}

module.exports = { resetDb, registerAndLogin, createQuestion, request, app, prisma };