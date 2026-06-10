import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)

  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      name: '系统管理员',
      passwordHash,
      role: 'ADMIN',
    },
  })

  const techDept = await prisma.department.upsert({
    where: { name: '技术部' },
    update: {},
    create: {
      name: '技术部',
    },
  })

  const financeDept = await prisma.department.upsert({
    where: { name: '财务部' },
    update: {},
    create: {
      name: '财务部',
    },
  })

  const hrDept = await prisma.department.upsert({
    where: { name: '人事部' },
    update: {},
    create: {
      name: '人事部',
    },
  })

  await prisma.user.upsert({
    where: { email: 'tech.manager@company.com' },
    update: {},
    create: {
      email: 'tech.manager@company.com',
      name: '张经理',
      passwordHash,
      role: 'MANAGER',
      departmentId: techDept.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'finance@company.com' },
    update: {},
    create: {
      email: 'finance@company.com',
      name: '李财务',
      passwordHash,
      role: 'FINANCE',
      departmentId: financeDept.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'hr.manager@company.com' },
    update: {},
    create: {
      email: 'hr.manager@company.com',
      name: '刘经理',
      passwordHash,
      role: 'MANAGER',
      departmentId: hrDept.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'employee1@company.com' },
    update: {},
    create: {
      email: 'employee1@company.com',
      name: '王员工',
      passwordHash,
      role: 'EMPLOYEE',
      departmentId: techDept.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'employee2@company.com' },
    update: {},
    create: {
      email: 'employee2@company.com',
      name: '赵员工',
      passwordHash,
      role: 'EMPLOYEE',
      departmentId: hrDept.id,
    },
  })

  console.log('种子数据创建完成!')
  console.log('测试账号 (密码均为 123456):')
  console.log('- 管理员: admin@company.com')
  console.log('- 技术部主管: tech.manager@company.com')
  console.log('- 人事部主管: hr.manager@company.com')
  console.log('- 财务: finance@company.com')
  console.log('- 技术部员工: employee1@company.com')
  console.log('- 人事部员工: employee2@company.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
