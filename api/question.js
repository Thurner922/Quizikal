export default async function handler(req, res) {
  const letters = ['A', 'B', 'C', 'D'];
  const forcedAnswer = letters[Math.floor(Math.random() * 4)];

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
          content: `Generate one multiple choice English grammar question at a 5th grade level in ACT format. Vary the grammar concepts tested such as commas, subject-verb agreement, punctuation, capitalization, or sentence structure.

The correct answer MUST be option ${forcedAnswer}. Build the question so that ${forcedAnswer} is genuinely the correct answer.

Respond in this EXACT JSON format and nothing else:
{
  "question": "the question text here",
  "choices": {
    "A": "first choice",
    "B": "second choice", 
    "C": "third choice",
    "D": "fourth choice"
  },
  "correct": "${forcedAnswer}",
  "explanation": "explanation of why ${forcedAnswer} is correct"
}`
        }
      ]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  res.status(200).json(parsed);
}
