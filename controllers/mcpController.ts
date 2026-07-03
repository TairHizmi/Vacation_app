import { Request, Response } from 'express';
import db from '../services/dbService';

interface MCPRequestBody {
  question?: string;
}

interface RecommendationRequestBody {
  destination?: string;
}

const AI_API_KEY = process.env.API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo';

const callOpenAIChat = async (prompt: string): Promise<string> => {
  if (!AI_API_KEY) {
    throw new Error('AI API key is not configured.')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert travel planner that returns concise, friendly markdown-formatted recommendations.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('OpenAI did not return a valid answer.')
  }

  return content.trim()
}

const queryDatabase = async (req: Request, res: Response<{ answer: string } | { error: string }>) => {
  try {
    const { question } = req.body as MCPRequestBody;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const normalized = question.trim().toLowerCase().replace(/[?.!]/g, '');
    const hasVacationWords = normalized.includes('vacation') || normalized.includes('vacations');
    const hasListWords = normalized.includes('list') || normalized.includes('show') || normalized.includes('all');
    let query: string | null = null;
    let params: Array<string | number | boolean | null> = [];
    let answer = '';

    if (hasVacationWords && hasListWords) {
      query = `
        SELECT destination, start_date, end_date, price
        FROM vacations
        ORDER BY start_date ASC
      `;
      const results = await db.query<Array<{ destination: string; start_date: string; end_date: string; price: number }>>(query, params);
      if (results.length === 0) {
        answer = 'No vacations were found.';
      } else {
        answer = 'All vacations:\n' +
          results
            .map((row) => `- ${row.destination}: $${row.price} (${row.start_date} → ${row.end_date})`)
            .join('\n');
      }
    } else if (normalized.includes('active vacation') || normalized.includes('active vacations')) {
      query = `
        SELECT COUNT(*) AS count
        FROM vacations
        WHERE start_date <= CURDATE() AND end_date >= CURDATE()
      `;
      const results = await db.query<Array<{ count: number }>>(query, params)
      const count = Number(results[0]?.count ?? 0)
      answer = `There are **${count} active vacations** right now.`
    } else if (normalized.includes('average price')) {
      query = `
        SELECT ROUND(AVG(price), 2) AS average_price
        FROM vacations
      `;
      const results = await db.query<Array<{ average_price: number }>>(query, params)
      const average = Number(results[0]?.average_price ?? 0)
      answer = `The average vacation price is **$${average.toFixed(2)}**.`
    } else if (normalized.includes('future vacation') || normalized.includes('future vacations') || normalized.includes('upcoming vacation') || normalized.includes('upcoming vacations')) {
      const locationMatch = normalized.match(/in\s+([a-zA-Z\s]+)$/)
      if (locationMatch && locationMatch[1]) {
        const location = locationMatch[1].trim()
        query = `
          SELECT destination, start_date, end_date
          FROM vacations
          WHERE start_date > CURDATE() AND LOWER(destination) LIKE ?
          ORDER BY start_date ASC
        `;
        params = [`%${location.toLowerCase()}%`];
      } else {
        query = `
          SELECT destination, start_date, end_date
          FROM vacations
          WHERE start_date > CURDATE()
          ORDER BY start_date ASC
        `;
      }

      const results = await db.query<Array<{ destination: string; start_date: string; end_date: string }>>(query, params)
      if (results.length === 0) {
        answer = 'No upcoming vacations were found.'
      } else {
        answer = 'Upcoming vacations:\n' +
          results
            .map((row) => `- ${row.destination} (${row.start_date} → ${row.end_date})`)
            .join('\n')
      }
    } else {
      const fallbackLines = [
        'Unable to parse the question. Try asking about active vacations, average price, upcoming vacations, or list all vacations.',
        `You asked: "${question.trim()}"`,
      ]
      console.warn('MCP query could not parse:', question.trim());
      return res.status(400).json({ error: fallbackLines.join(' ') });
    }

    res.json({ answer })
  } catch (error) {
    console.error('MCP query error:', error);
    res.status(500).json({ error: 'Unable to process query.' });
  }
};

const getRecommendation = async (req: Request, res: Response<{ answer: string } | { error: string }>) => {
  try {
    const { destination } = req.body as RecommendationRequestBody;

    if (!destination || !destination.trim()) {
      return res.status(400).json({ error: 'Destination is required.' });
    }

    const prompt = `Create a friendly travel recommendation for ${destination.trim()}. Include key highlights, suggested activities, and why this destination is worth visiting. Return the answer in markdown format.`
    const answer = await callOpenAIChat(prompt)
    res.json({ answer })
  } catch (error) {
    console.error('Recommendation error:', error)
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message })
    }
    res.status(500).json({ error: 'Unable to generate recommendation.' })
  }
};

export default {
  queryDatabase,
  getRecommendation,
};
