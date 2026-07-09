'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function fetchDashboardPackages() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized', packages: [] }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/packages/`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      if (res.status === 403) return { error: 'Not approved yet', packages: [] }
      throw new Error('Failed to fetch packages')
    }

    const data = await res.json()
    return { packages: data }
  } catch (error: any) {
    console.error("Dashboard fetch error:", error)
    return { error: error.message, packages: [] }
  }
}

export async function createDashboardPackage(payload: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized' }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/packages/`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      throw new Error('Failed to create package')
    }

    const data = await res.json()
    revalidatePath('/dashboard')
    revalidatePath('/packages')
    return { success: true, data }
  } catch (error: any) {
    console.error("Create package error:", error)
    return { error: error.message }
  }
}

export async function fetchDashboardPackage(id: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized', package: null }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/packages/${id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error('Failed to fetch package')
    }

    const data = await res.json()
    return { data }
  } catch (error: any) {
    console.error(`Fetch package ${id} error:`, error)
    return { error: error.message, data: null }
  }
}

export async function updateDashboardPackage(id: string, payload: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized' }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/packages/${id}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      throw new Error('Failed to update package')
    }

    const data = await res.json()
    revalidatePath('/dashboard')
    revalidatePath('/packages')
    revalidatePath(`/packages/${id}`)
    return { success: true, data }
  } catch (error: any) {
    console.error(`Update package ${id} error:`, error)
    return { error: error.message }
  }
}

export async function runPackageAudit(packageId: number, sourceMarkets: string[] = ["DE"]) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized' }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/jobs/run-audit/${packageId}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ source_markets: sourceMarkets })
    })

    if (!res.ok) {
      throw new Error('Failed to trigger package audit')
    }

    const data = await res.json()
    revalidatePath('/dashboard')
    revalidatePath('/packages')
    return { success: true, data }
  } catch (error: any) {
    console.error(`Run package audit ${packageId} error:`, error)
    return { error: error.message }
  }
}

export async function fetchCurrentUserProfile() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token || !session.user?.email) {
    return { error: 'Not authorized', user: null }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/users/by-email/${encodeURIComponent(session.user.email)}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error('Failed to fetch user profile')
    }

    const data = await res.json()
    return { user: data }
  } catch (error: any) {
    console.error("Fetch profile error:", error)
    return { error: error.message, user: null }
  }
}

export async function deletePackage(packageId: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized' }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/packages/${packageId}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    if (!res.ok) {
      throw new Error('Failed to delete package')
    }

    revalidatePath('/dashboard')
    revalidatePath('/packages')
    return { success: true }
  } catch (error: any) {
    console.error(`Delete package ${packageId} error:`, error)
    return { error: error.message }
  }
}

export async function getJobStatus(jobId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized', data: null }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/jobs/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error('Failed to fetch job status')
    }

    const data = await res.json()
    return { data }
  } catch (error: any) {
    console.error(`Fetch job status ${jobId} error:`, error)
    return { error: error.message, data: null }
  }
}

export async function getLatestJobForPackage(packageId: number) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Not authorized', data: null }
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/jobs/package/${packageId}/latest-job`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error('Failed to fetch latest job for package')
    }

    const data = await res.json()
    return { data }
  } catch (error: any) {
    console.error(`Fetch latest job for package ${packageId} error:`, error)
    return { error: error.message, data: null }
  }
}

