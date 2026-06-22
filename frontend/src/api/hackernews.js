const BACKEND_API_BASE = 'http://localhost:8000'

export const hackerNewsCategories = [
  'top',
  'new',
  'best'
]

export const fetchHackerNewsPosts = async (category = 'top', limit = 5) => {
  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/hackernews/posts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category,
          limit: limit
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('Error fetching HackerNews posts:', error)
    throw error
  }
}
