const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator'
    }
  });

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: 'Muharram Rakan Al-Ajmi Customs Clearance Office',
      companyNameAr: 'مكتب محرم راكان العجمي للتخليص الجمركي',
      ownerName: 'Mohd. hassan Mohd. Abd. Haq',
      ownerNameAr: 'محمد حسن محمد عبدالحق',
      phone: '60744492',
      lastInvoiceNumber: 1000
    }
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
