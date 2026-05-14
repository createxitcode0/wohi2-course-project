const bcrypt = require("bcrypt");
const { resetDb, request, app, prisma } = require("./helpers");

beforeEach(resetDb);

describe("auth tests", () => {
  it("registers, hashes the password, returns a token", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ email: "a@test.io", password: "pw12345", name: "A" });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));

    const user = await prisma.user.findUnique({ where: { email: "a@test.io" } });
    expect(user.password).not.toBe("pw12345");
    expect(await bcrypt.compare("pw12345", user.password)).toBe(true);
  });

  it("returns 400 when fields are missing on register", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ email: "a@test.io" });
    expect(res.status).toBe(400);
  });

  it("returns 409 on duplicate email", async () => {
    await request(app).post("/api/auth/register")
      .send({ email: "a@test.io", password: "pw12345", name: "A" });
    const res = await request(app).post("/api/auth/register")
      .send({ email: "a@test.io", password: "pw12345", name: "A" });
    expect(res.status).toBe(409);
  });

  it("returns 401 for wrong password", async () => {
    await request(app).post("/api/auth/register")
      .send({ email: "a@test.io", password: "pw12345", name: "A" });
    const res = await request(app).post("/api/auth/login")
      .send({ email: "a@test.io", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("returns 401 for missing user", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "nobody@test.io", password: "pw12345" });
    expect(res.status).toBe(401);
  });

  it("returns same error message for missing user vs wrong password", async () => {
    await request(app).post("/api/auth/register")
      .send({ email: "a@test.io", password: "pw12345", name: "A" });
    const wrongPass = await request(app).post("/api/auth/login")
      .send({ email: "a@test.io", password: "wrongpassword" });
    const noUser = await request(app).post("/api/auth/login")
      .send({ email: "nobody@test.io", password: "pw12345" });
    expect(wrongPass.body.message).toBe(noUser.body.message);
  });

  it("returns 200 and a token on valid login", async () => {
    await request(app).post("/api/auth/register")
      .send({ email: "a@test.io", password: "pw12345", name: "A" });
    const res = await request(app).post("/api/auth/login")
      .send({ email: "a@test.io", password: "pw12345" });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });
});