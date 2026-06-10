export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/',
    '/expenses/:path*',
    '/approvals/:path*',
    '/history/:path*',
    '/admin/:path*',
  ],
}
