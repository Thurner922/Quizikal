export default async function handler(req, res) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate one multiple choice question testing English grammar skills at a 5th grade level in ACT format. 
          Include:
          - The question
          - Four answer choices labeled A, B, C, D
          - The correct answer
          - A brief explanation of why it is correct
          Format it clearly and simply.`
        }
      ]
    })
  });

  const data = await response.json();
  const question = data.content[0].text;
  res.status(200).json({ question });
}
