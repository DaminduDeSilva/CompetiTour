'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function adminLogin(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/admin/login?error=Email and password are required')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Supabase login error:", error)
    return redirect(`/admin/login?error=Invalid credentials: ${error.message}`)
  }

  // Check if they are actually a superuser
  try {
    const res = await fetch(`${API_URL}/api/v1/users/by-email/${email}`);
    if (res.ok) {
      const user = await res.json();
      if (!user.is_superuser) {
        // Not an admin, kick them out
        await supabase.auth.signOut()
        return redirect('/admin/login?error=Unauthorized: Admin access required')
      }
    } else {
      await supabase.auth.signOut()
      return redirect('/admin/login?error=Could not verify admin status')
    }
  } catch (err) {
    console.error("Failed to fetch user status", err)
    await supabase.auth.signOut()
    return redirect('/admin/login?error=System error verifying admin status')
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function adminSignOut() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  revalidatePath('/admin', 'layout')
  redirect('/admin/login')
}

// Data fetching actions for the Admin Dashboard
export async function fetchUsersAdmin() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized' }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      if (res.status === 403) return { error: 'RBAC: Admin access required' }
      throw new Error('Failed to fetch users')
    }

    const data = await res.json()
    return { users: data }
  } catch (error: any) {
    console.error("Admin fetch error:", error)
    return { error: error.message }
  }
}

export async function approveUserAdmin(userId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) return { error: 'Not authorized' }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/${userId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    if (!res.ok) {
      throw new Error('Failed to approve user')
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
