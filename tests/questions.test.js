const { resetDb, registerAndLogin, createQuestion, request, app, prisma } = require("./helpers");

beforeEach(resetDb);

describe("question tests", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/questions");
    expect(res.status).toBe(401);
  });

  it("returns 200 with correct pagination shape", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/questions")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("page");
    expect(res.body).toHaveProperty("limit");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("totalPages");
  });

  it("returns 404 for unknown question", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/questions/99999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found");
  });

  it("returns 400 for invalid question body", async () => {
    const token = await registerAndLogin();
    const res = await request(app).post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .field("question", "")
      .field("answer", "");
    expect(res.status).toBe(400);
  });

  it("returns 201 on valid question create", async () => {
    const token = await registerAndLogin();
    const res = await request(app).post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .field("question", "What is REST?")
      .field("answer", "An architectural style");
    expect(res.status).toBe(201);
    expect(res.body.question).toBe("What is REST?");
  });

  it("returns 403 when editing someone else's question", async () => {
    const aliceToken = await registerAndLogin("alice@test.io", "Alice");
    const question = await createQuestion(aliceToken, { question: "Alice's question", answer: "A" });

    const bobToken = await registerAndLogin("bob@test.io", "Bob");
    const res = await request(app).put(`/api/questions/${question.id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .field("question", "hijacked")
      .field("answer", "x");

    expect(res.status).toBe(403);

    const after = await prisma.question.findUnique({ where: { id: question.id } });
    expect(after.question).toBe("Alice's question");
  });

  it("returns 403 when deleting someone else's question", async () => {
    const aliceToken = await registerAndLogin("alice@test.io", "Alice");
    const question = await createQuestion(aliceToken, { question: "Alice's question", answer: "A" });

    const bobToken = await registerAndLogin("bob@test.io", "Bob");
    const res = await request(app).delete(`/api/questions/${question.id}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });
});