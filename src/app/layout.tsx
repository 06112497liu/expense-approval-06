import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/navbar'
import { getCurrentUser } from '@/lib/permissions'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '财务报销系统',
  description: '公司财务报销审批管理系统',
}

function isValidUser(user: any): user is {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE'
  departmentId: number | null
  departmentName: string | null
} {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.role === 'string'
  )
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const pathname = headersList.get('x-invoke-path') || ''

  const isLoginPage = pathname === '/login' || pathname.startsWith('/login')

  const rawUser = await getCurrentUser()
  const user = isValidUser(rawUser) ? rawUser : null

  if (user && isLoginPage) {
    redirect('/')
  }

  const showNavbar = user && !isLoginPage

  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          {showNavbar ? (
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="container mx-auto py-6 px-4">{children}</main>
            </div>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  )
}
