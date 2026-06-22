const BACKEND_API_BASE = 'http://localhost:8000'

export const fetchRedditPosts = async (query = '', limit = 5) => {
  try {
    // Set 70-second timeout (backend has 60s, buffer for network latency)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 70000)

    const response = await fetch(
      `${BACKEND_API_BASE}/api/reddit/posts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          limit: limit
        }),
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Fetched ${(data.posts || []).length} Reddit posts${data.cached ? ' (cached)' : ''}`)
    return data.posts || []
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Reddit fetch timeout (70s)')
    } else {
      console.error('Error fetching Reddit posts:', error)
    }
    throw error
  }
}