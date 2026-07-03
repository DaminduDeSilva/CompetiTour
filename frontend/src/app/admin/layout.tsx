import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  // Protect all /admin routes. Note: we don't want to protect /admin/login itself, 
  // but if we put layout.tsx inside /admin, it wraps /admin/login too! 
  // Let's rely on middleware or handle it locally in pages.
  // Actually, wait, if this layout wraps /admin/login, we will infinite loop.
  // We should NOT redirect if the path is exactly /admin/login.
  
  // Since we don't have easy access to pathname in a Server Layout without headers(),
  // we'll just let the `page.tsx` of `/admin` do the redirect, OR we create a layout 
  // specifically for the dashboard that isn't shared with `/login`.
  
  return <>{children}</>
}
