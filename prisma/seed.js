const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuestions = [
  {
    question: "What is HTTP?",
    answer: "HTTP is the protocol used for communication on the web.",
    keywords: ["http", "web"],
  },
  {
    question: "What is REST API?",
    answer: "REST API uses standard HTTP methods like GET, POST, PUT, DELETE.",
    keywords: ["api", "rest"],
  },
  {
    question: "What is Node.js?",
    answer: "Node.js allows JavaScript to run on the server side.",
    keywords: ["nodejs", "javascript"],
  },
  {
    question: "What is Prisma?",
    answer: "Prisma is an ORM used to interact with databases easily.",
    keywords: ["prisma", "database"],
  },
];

async function main() {
  await prisma.question.deleteMany();
  await prisma.keyword.deleteMany();

  for (const item of seedQuestions) {
    await prisma.question.create({
      data: {
        question: item.question,
        answer: item.answer,
        keywords: {
          connectOrCreate: item.keywords.map((kw) => ({
            where: { name: kw.toLowerCase() },
            create: { name: kw.toLowerCase() },
          })),
        },
      },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });