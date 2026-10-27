import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

async function promptUser(question: string, defaultValue: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return defaultValue;
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} [${defaultValue}]: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  console.log('========================================================');
  console.log('  CREATE SUPERADMIN (ADMINISTRATOR) - E-RAPOR DIGITAL   ');
  console.log('========================================================\n');

  try {
    const defaultUsername = 'superadmin';
    const defaultEmail = 'admin@masyithohkotategal.my.id';
    const defaultPhone = '081234567890';
    const defaultPassword = 'AdminMasyithoh2026!';

    const username = getArg('--username') || (await promptUser('Username', defaultUsername));
    const email = getArg('--email') || (await promptUser('Email', defaultEmail));
    const phone = getArg('--phone') || (await promptUser('No. Telepon / WhatsApp', defaultPhone));
    const password = getArg('--password') || (await promptUser('Password', defaultPassword));

    if (!username || username.length < 3) {
      throw new Error('Username minimal 3 karakter.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password minimal 6 karakter.');
    }

    console.log('\n[Processing] Mengenkripsi password dan menyimpan ke database...');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { username },
      update: {
        email,
        phoneNumber: phone,
        passwordHash,
        role: Role.ADMINISTRATOR,
        isActive: true,
      },
      create: {
        username,
        email,
        phoneNumber: phone,
        passwordHash,
        role: Role.ADMINISTRATOR,
        isActive: true,
      },
    });

    console.log('\n✅ Akun Superadmin berhasil dibuat / diperbarui:');
    console.log(`   - ID          : ${user.id}`);
    console.log(`   - Username    : ${user.username}`);
    console.log(`   - Email       : ${user.email}`);
    console.log(`   - No. Telepon : ${user.phoneNumber}`);
    console.log(`   - Role        : ${user.role}`);
    console.log(`   - Status      : ${user.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    console.log('========================================================\n');
  } catch (error: any) {
    console.error('❌ Gagal membuat akun Superadmin:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
