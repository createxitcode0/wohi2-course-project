const { resetDb, registerAndLogin, createQuestion, request, app } = require("./helpers");

beforeEach(resetDb);

describe("attempts tests", () => {
  it("returns correct: true when answer matches", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, { question: "Capital of Finland?", answer: "Helsinki" });

    const res = await request(app).post(`/api/questions/${question.id}/play`)
      .set("Authorization", `Bearer ${token}`)
      .send({ answer: "Helsinki" });

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
    expect(res.body.correctAnswer).toBe("Helsinki");
  });

  it("returns correct: true when answer matches", async () => {
  const token = await registerAndLogin();
  const question = await createQuestion(token, { question: "Capital of Finland?", answer: "Helsinki" });

  
  const res = await request(app).post(`/api/questions/${question.id}/play`)
    .set("Authorization", `Bearer ${token}`)
    .send({ answer: "Helsinki" });

  expect(res.status).toBe(200);
  expect(res.body.correct).toBe(true);
  expect(res.body.correctAnswer).toBe("Helsinki");
});

  it("is case-insensitive when checking answer", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, { question: "Capital of Finland?", answer: "Helsinki" });

    const res = await request(app).post(`/api/questions/${question.id}/play`)
      .set("Authorization", `Bearer ${token}`)
      .send({ answer: "HELSINKI" });

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
  });

  it("returns 400 when answer is missing", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, { question: "Capital of Finland?", answer: "Helsinki" });

    const res = await request(app).post(`/api/questions/${question.id}/play`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 when question does not exist", async () => {
    const token = await registerAndLogin();
    const res = await request(app).post("/api/questions/99999/play")
      .set("Authorization", `Bearer ${token}`)
      .send({ answer: "Helsinki" });

    expect(res.status).toBe(404);
  });
});