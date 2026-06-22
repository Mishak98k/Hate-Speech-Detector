const BACKEND_API_BASE = 'http://localhost:8000'

export const fetchTwitterPosts = async (query = '', limit = 5) => {
  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/twitter/posts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, limit: limit })
      }
    )

    if (response.status === 429) {
      throw new Error('Rate limit hit — please wait 10 seconds and try again')
    }

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('Error fetching Twitter posts:', error)
    throw error
  }
}