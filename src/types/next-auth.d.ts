import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE'
      departmentId: number | null
      departmentName: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE'
    departmentId: number | null
    departmentName: string | null
  }
}
