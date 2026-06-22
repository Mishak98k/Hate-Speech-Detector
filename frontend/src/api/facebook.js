const BACKEND_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const fetchFacebookPosts = async (query = '', limit = 5) => {
  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/facebook/posts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, limit: limit })
      }
    )

    if (response.status === 429) {
      throw new Error('Rate limit hit — please wait and try again')
    }

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('Error fetching Facebook posts:', error)
    throw error
  }
}
