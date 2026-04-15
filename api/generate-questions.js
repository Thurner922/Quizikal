import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function generateQuestion(subject, gradeLevel) {
  const subjectPrompts = {
    english: `Generate one multiple choice English grammar question for grade ${gradeLevel} in ACT format. Test concepts like commas, subject-verb agreement, punctuation, capitalization, or sentence structure.`,
    math: `Generate one multiple choice Math question for grade ${gradeLevel} in ACT format. Test concepts appropriate for grade ${gradeLevel} math skills.`,
    reading: `Generate one multiple choice Reading comprehension or vocabulary question for grade ${gradeLevel} in ACT format.`,
    science: `Generate one multiple choice Science data interpretation question for grade ${gradeLevel} in ACT format. Focus on reading charts, graphs, or research summaries.`
  };

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
          content: `${subjectPrompts[subject]}

The correct answer MUST be option ${forcedAnswer}. Build the question so that ${forcedAnswer} is genuinely the correct answer.

All four answer choices MUST be completely different from each other. Never use the same text in two choices.

Each wrong answer should represent a different type of mistake.

Only ONE answer should be unambiguously correct. Avoid ambiguous cases.

Before responding verify:
1. Exactly one unambiguously correct answer
2. All four choices are distinct
3. Explanation accurately describes why each wrong answer is wrong
4. Content is appropriate for grade ${gradeLevel}

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
  "explanation": "explanation of why ${forcedAnswer} is correct and why others are wrong"
}`
        }
      ]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const subjects = ['english', 'math', 'reading', 'science'];
  const gradeLevels = [3, 4, 5, 6, 7, 8, 9, 10, 11];
  const questionsPerBatch = 5;

  let generated = 0;
  let errors = 0;

  for (const subject of subjects) {
    for (const gradeLevel of gradeLevels) {
      for (let i = 0; i < questionsPerBatch; i++) {
        try {
          const question = await generateQuestion(subject, gradeLevel);
          
          await supabase.from('questions').insert({
            subject,
            grade_level: gradeLevel,
            question: question.question,
            choice_a: question.choices.A,
            choice_b: question.choices.B,
            choice_c: question.choices.C,
            choice_d: question.choices.D,
            correct: question.correct,
            explanation: question.explanation
          });

          generated++;
        } catch (error) {
          errors++;
          console.error(`Error generating ${subject} grade ${gradeLevel}:`, error);
        }
      }
    }
  }

  res.status(200).json({ 
    message: 'Batch generation complete',
    generated,
    errors
  });
}
