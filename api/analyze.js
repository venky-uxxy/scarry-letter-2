export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { letterText } = req.body;

  if (!letterText || letterText.trim().length < 50) {
    return res.status(400).json({ error: 'Please paste more of your letter — need at least a few sentences.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
  }

  const prompt = `You are a plain-English legal letter decoder helping everyday people understand scary official letters. Analyze the following letter and respond EXACTLY in this format:\n\nSEVERITY: [LOW / MEDIUM / HIGH]\nLETTER TYPE: [Brief name of what kind of letter this is]\n\nPLAIN ENGLISH:\n[2-4 sentences explaining in simple, calm language what this letter actually is and what the sender wants. Write as if explaining to a friend who has never seen this before.]\n\nRED FLAGS:\n- [List each concerning clause, hidden fee, tight deadline, or threatening language. Be specific.]\n- [Add as many as needed]\n\nNEXT STEPS:\n- [List specific actions the person should take, in order of priority]\n- [Include any deadlines they must meet]\n- [Mention when to get professional help]\n\nYOUR RIGHTS:\n- [List their legal rights in this situation - FDCPA, tenant rights, patient rights, etc.]\n- [Mention what the sender legally can and cannot do]\n- [Any negotiation leverage they have]\n\nLetter to analyze:\n---\n${letterText.slice(0, 4000)}\n---\n\nBe direct, calm, and empowering. Don't use legal jargon. Don't be alarmist. Help them understand exactly what's happening and what they can do.`;

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'AI service error');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new Error('No response from AI');

    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}
