const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuestions = [
  {
    question: "What is HTTP?",
    answer: "A protocol for communication on the web",
  },
  {
    question: "What is Node.js?",
    answer: "A JavaScript runtime on the server",
  },
];

async function main() {
  await prisma.question.deleteMany();

  for (const q of seedQuestions) {
    await prisma.question.create({
      data: q,
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());