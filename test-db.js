const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function run() {
  const count = await prisma.student.count();
  console.log("Current count:", count);
  
  const lastStudent = await prisma.student.findFirst({
    orderBy: { studentCode: 'desc' }
  });
  
  console.log("Last student:", lastStudent);
  
  let nextSequence = 1;
  if (lastStudent && lastStudent.studentCode.startsWith('2312026')) {
    const lastSeqStr = lastStudent.studentCode.slice(7);
    const lastSeqNum = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeqNum)) {
      nextSequence = lastSeqNum + 1;
    }
  }
  
  console.log("Next sequence will be:", nextSequence);
}

run().catch(console.error).finally(() => prisma.$disconnect());
