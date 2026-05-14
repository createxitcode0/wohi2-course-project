const { resetDb, registerAndLogin, request, app } = require("./helpers");

beforeEach(resetDb);

describe("boundary tests", () => {
  it("clamps limit above 100 to 100", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/questions?limit=999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(100);
  });

  it("treats page=0 as page=1", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/questions?page=0")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.page).toBe(1);
  });

  it("treats page=-1 as page=1", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/questions?page=-1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.page).toBe(1);
  });
});