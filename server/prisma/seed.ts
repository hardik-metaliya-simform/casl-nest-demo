import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: false, // Disable SSL for local development
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up existing data
  await prisma.managedDepartment.deleteMany();
  await prisma.note.deleteMany();
  await prisma.team.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  console.log('🧹 Cleaned up existing data');

  // Default password for all test users: password123
  const defaultPassword = await bcrypt.hash('password123', 10);
  console.log('🔑 Default password for all users: password123');

  // Create Departments
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
    },
  });

  const sales = await prisma.department.create({
    data: {
      name: 'Sales',
    },
  });

  const hr = await prisma.department.create({
    data: {
      name: 'Human Resources',
    },
  });

  console.log('✅ Created departments');

  // Create CTO
  const cto = await prisma.employee.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      password: defaultPassword,
      roles: ['CTO'],
      salary: 200000,
      departmentId: engineering.id,
    },
  });

  console.log('✅ Created CTO');

  // Create Team Managers (TM)
  const tmEngineering = await prisma.employee.create({
    data: {
      name: 'Bob Smith',
      email: 'bob.smith@company.com',
      password: defaultPassword,
      roles: ['TM'],
      salary: 150000,
      departmentId: engineering.id,
    },
  });

  const tmSales = await prisma.employee.create({
    data: {
      name: 'Carol Williams',
      email: 'carol.williams@company.com',
      password: defaultPassword,
      roles: ['TM'],
      salary: 140000,
      departmentId: sales.id,
    },
  });

  const tmHR = await prisma.employee.create({
    data: {
      name: 'David Brown',
      email: 'david.brown@company.com',
      password: defaultPassword,
      roles: ['TM'],
      salary: 130000,
      departmentId: hr.id,
    },
  });

  console.log('✅ Created Team Managers');

  // Create ManagedDepartment assignments for TMs
  await prisma.managedDepartment.createMany({
    data: [
      { employeeId: tmEngineering.id, departmentId: engineering.id },
      { employeeId: tmSales.id, departmentId: sales.id },
      { employeeId: tmHR.id, departmentId: hr.id },
    ],
  });

  console.log('✅ Created ManagedDepartment assignments');

  // Create Reporting Managers (RM)
  const rmBackend = await prisma.employee.create({
    data: {
      name: 'Emma Davis',
      email: 'emma.davis@company.com',
      password: defaultPassword,
      roles: ['RM'],
      salary: 120000,
      departmentId: engineering.id,
      reportingManagerId: tmEngineering.id,
    },
  });

  const rmFrontend = await prisma.employee.create({
    data: {
      name: 'Frank Miller',
      email: 'frank.miller@company.com',
      password: defaultPassword,
      roles: ['RM'],
      salary: 115000,
      departmentId: engineering.id,
      reportingManagerId: tmEngineering.id,
    },
  });

  const rmSales = await prisma.employee.create({
    data: {
      name: 'Grace Wilson',
      email: 'grace.wilson@company.com',
      password: defaultPassword,
      roles: ['RM'],
      salary: 110000,
      departmentId: sales.id,
      reportingManagerId: tmSales.id,
    },
  });

  const rmHR = await prisma.employee.create({
    data: {
      name: 'Henry Moore',
      email: 'henry.moore@company.com',
      password: defaultPassword,
      roles: ['RM'],
      salary: 105000,
      departmentId: hr.id,
      reportingManagerId: tmHR.id,
    },
  });

  console.log('✅ Created Reporting Managers');

  // Create Regular Employees
  const backendDev1 = await prisma.employee.create({
    data: {
      name: 'Ivy Taylor',
      email: 'ivy.taylor@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 90000,
      departmentId: engineering.id,
      reportingManagerId: rmBackend.id,
    },
  });

  const backendDev2 = await prisma.employee.create({
    data: {
      name: 'Jack Anderson',
      email: 'jack.anderson@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 85000,
      departmentId: engineering.id,
      reportingManagerId: rmBackend.id,
    },
  });

  const frontendDev1 = await prisma.employee.create({
    data: {
      name: 'Kelly Thomas',
      email: 'kelly.thomas@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 88000,
      departmentId: engineering.id,
      reportingManagerId: rmFrontend.id,
    },
  });

  const frontendDev2 = await prisma.employee.create({
    data: {
      name: 'Leo Jackson',
      email: 'leo.jackson@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 82000,
      departmentId: engineering.id,
      reportingManagerId: rmFrontend.id,
    },
  });

  const salesRep1 = await prisma.employee.create({
    data: {
      name: 'Maria White',
      email: 'maria.white@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 75000,
      departmentId: sales.id,
      reportingManagerId: rmSales.id,
    },
  });

  const salesRep2 = await prisma.employee.create({
    data: {
      name: 'Nathan Harris',
      email: 'nathan.harris@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 72000,
      departmentId: sales.id,
      reportingManagerId: rmSales.id,
    },
  });

  const hrSpecialist1 = await prisma.employee.create({
    data: {
      name: 'Olivia Martin',
      email: 'olivia.martin@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 68000,
      departmentId: hr.id,
      reportingManagerId: rmHR.id,
    },
  });

  const hrSpecialist2 = await prisma.employee.create({
    data: {
      name: 'Paul Garcia',
      email: 'paul.garcia@company.com',
      password: defaultPassword,
      roles: ['Employee'],
      salary: 65000,
      departmentId: hr.id,
      reportingManagerId: rmHR.id,
    },
  });

  console.log('✅ Created Regular Employees');

  // Create Teams
  const backendTeam = await prisma.team.create({
    data: {
      name: 'Backend Team',
      departmentId: engineering.id,
    },
  });

  const frontendTeam = await prisma.team.create({
    data: {
      name: 'Frontend Team',
      departmentId: engineering.id,
    },
  });

  const enterpriseSalesTeam = await prisma.team.create({
    data: {
      name: 'Enterprise Sales',
      departmentId: sales.id,
    },
  });

  const recruitmentTeam = await prisma.team.create({
    data: {
      name: 'Recruitment',
      departmentId: hr.id,
    },
  });

  console.log('✅ Created Teams');

  // Create Notes
  await prisma.note.createMany({
    data: [
      // Regular notes
      {
        content:
          'Q1 Sprint Planning: Planning for Q1 sprints focusing on new API features and performance improvements',
        employeeId: backendDev1.id,
        authorId: tmEngineering.id,
        isAdminOnly: false,
      },
      {
        content:
          'Code Review Guidelines: Updated code review process with new checklist and approval requirements',
        employeeId: rmBackend.id,
        authorId: tmEngineering.id,
        isAdminOnly: false,
      },
      {
        content:
          'Sales Target Q1: Q1 sales target set at $2M with focus on enterprise clients',
        employeeId: salesRep1.id,
        authorId: tmSales.id,
        isAdminOnly: false,
      },
      {
        content:
          'UI/UX Design System: New design system implemented with React components library',
        employeeId: frontendDev1.id,
        authorId: rmFrontend.id,
        isAdminOnly: false,
      },
      // Admin-only notes (private — only the authoring TM + CTO can read)
      {
        content:
          'CONFIDENTIAL - Salary Review 2024: Company-wide salary review scheduled for Q2 with 5-10% increase budget',
        employeeId: cto.id,
        authorId: cto.id,
        isAdminOnly: true,
      },
      {
        content:
          'CONFIDENTIAL - Engineering Restructure: Planning to split engineering into 3 teams with new leadership structure',
        employeeId: tmEngineering.id,
        authorId: tmEngineering.id,
        isAdminOnly: true,
      },
      {
        content:
          'CONFIDENTIAL - Performance Issues: Performance improvement plan for underperforming team members - confidential discussion',
        employeeId: salesRep1.id,
        authorId: tmSales.id,
        isAdminOnly: true,
      },
      {
        content:
          'CONFIDENTIAL - Budget Planning: Department budget allocation for Q2 - HR to receive 20% increase',
        employeeId: hrSpecialist1.id,
        authorId: tmHR.id,
        isAdminOnly: true,
      },
    ],
  });

  console.log('✅ Created Notes');

  // console.log('\n🎉 Seed completed successfully!\n');
  // console.log('📊 Summary:');
  // console.log(`   - ${await prisma.department.count()} Departments`);
  // console.log(`   - ${await prisma.employee.count()} Employees`);
  // console.log(`     • 1 CTO`);
  // console.log(`     • 3 Team Managers (TM)`);
  // console.log(`     • 4 Reporting Managers (RM)`);
  // console.log(`     • 8 Regular Employees`);
  // console.log(
  //   `   - ${await prisma.managedDepartment.count()} ManagedDepartment assignments`,
  // );
  // console.log(`   - ${await prisma.team.count()} Teams`);
  // console.log(
  //   `   - ${await prisma.note.count()} Notes (${await prisma.note.count({ where: { isAdminOnly: true } })} admin-only)\n`,
  // );

  console.log('🔑 Test Users:');
  console.log(`   CTO: alice.johnson@company.com`);
  console.log(`   TM (Engineering): bob.smith@company.com`);
  console.log(`   TM (Sales): carol.williams@company.com`);
  console.log(`   TM (HR): david.brown@company.com`);
  console.log(`   RM (Backend): emma.davis@company.com`);
  console.log(`   RM (Frontend): frank.miller@company.com`);
  console.log(`   RM (Sales): grace.wilson@company.com`);
  console.log(`   RM (HR): henry.moore@company.com`);
  console.log(`   Employee (Backend): ivy.taylor@company.com`);
  console.log(`   Employee (Sales): maria.white@company.com`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
