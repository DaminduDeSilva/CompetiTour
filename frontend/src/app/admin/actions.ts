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

// ---------- Helper to get admin session token ----------
async function getAdminToken() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// ---------- Data fetching actions ----------

export async function fetchUsersAdmin() {
  const token = await getAdminToken()
  if (!token) return { error: 'Not authorized' }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/`, {
      headers: { 'Authorization': `Bearer ${token}` },
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

export async function fetchUserAdmin(userId: string) {
  const token = await getAdminToken()
  if (!token) return { error: 'Not authorized', user: null }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })

    if (!res.ok) {
      if (res.status === 404) return { error: 'User not found', user: null }
      throw new Error('Failed to fetch user')
    }

    const data = await res.json()
    return { user: data }
  } catch (error: any) {
    console.error("Admin fetch user error:", error)
    return { error: error.message, user: null }
  }
}

export async function approveUserAdmin(userId: string) {
  const token = await getAdminToken()
  if (!token) return { error: 'Not authorized' }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!res.ok) throw new Error('Failed to approve user')

    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deactivateUserAdmin(userId: string) {
  const token = await getAdminToken()
  if (!token) return { error: 'Not authorized' }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/${userId}/deactivate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!res.ok) throw new Error('Failed to deactivate user')

    revalidatePath('/admin')
    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateUserAdmin(userId: string, payload: {
  subscription_tier?: string;
  is_active?: boolean;
  company_name?: string;
  full_name?: string;
}) {
  const token = await getAdminToken()
  if (!token) return { error: 'Not authorized' }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error('Failed to update user')

    const data = await res.json()
    revalidatePath('/admin')
    revalidatePath('/admin/tenants')
    return { success: true, user: data }
  } catch (error: any) {
    return { error: error.message }
  }
}
