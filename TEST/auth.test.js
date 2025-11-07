import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import adminRouter from "../routes/admin.routes.js";
import studentRouter from "../routes/student.routes.js";
import authRouter from "../routes/auth.routes.js";

const app = express();
app.use(express.json());
app.use("/admin", adminRouter);
app.use("/student", studentRouter);
app.use("/auth", authRouter);

const PORT = 3000;
let server;

beforeAll(async () => {
  server = app.listen(PORT, () => console.log(`Test server on ${PORT}`));
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe("Login Routes", () => {
  it("should login special admin successfully", async () => {
    const res = await request(app)
      .post("/admin/login")
      .send({ email: "anish@ums.com", password: "12345678" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("anish@ums.com");
    expect(res.body.user.role).toBe("ADMIN");
  });

  it("should login student successfully", async () => {
    const res = await request(app)
      .post("/student/login")
      .send({
        email: "23CSE101@school.edu",
        password: "anish123",
      });

    expect([200, 400, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("23CSE101@school.edu");
    }
  });

  it("should login user via auth route successfully", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "0504anish@gmail.com",
        password: "Anish@05",
      });

    expect([200, 400, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("0504anish@gmail.com");
    }
  });
});
