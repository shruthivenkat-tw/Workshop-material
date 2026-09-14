export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Pull API Key securely from Vercel Environment Variables
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY environment variable missing.' });
  }

  const { audioBase64, systemInstruction, schema } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: 'Missing audio data' });
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: "audio/webm",
                data: audioBase64
              }
            },
            { text: "Analyze this audio buffer from our strategy table and determine if an interjection is needed according to system instructions." }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: schema,
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API Error: ${errText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("Vercel Proxy Error:", err);
    return res.status(500).json({ error: err.message });
  }
}