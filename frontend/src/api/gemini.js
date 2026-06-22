const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const analyzeText = async (text) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze text')
    }

    return await response.json()
  } catch (error) {
    console.error('Error analyzing text:', error)
    throw error
  }
}

export const analyzeImage = async (imageBase64) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze image')
    }

    return await response.json()
  } catch (error) {
    console.error('Error analyzing image:', error)
    throw error
  }
}