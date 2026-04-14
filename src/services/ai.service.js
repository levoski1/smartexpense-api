// src/services/ai.service.js
import Groq   from 'groq-sdk';
import { config } from '../config/env.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { BudgetRepository }      from '../repositories/budget.repository.js';
import { AppError }              from '../utils/AppError.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

export const AIService = {
  async getInsights(userId) {
    // Gather all context needed for the AI
    const [transactions, budgets, summary] = await Promise.all([
      TransactionRepository.getRecentForAI(userId, 30),
      BudgetRepository.getForAI(userId),
      TransactionRepository.getSummary(userId),
    ]);

    if (transactions.length === 0) {
      return {
        insights: [],
        recommendations: ['Start adding transactions to receive AI-powered insights.'],
        overallHealthScore: null,
        generatedAt: new Date().toISOString(),
      };
    }

    const prompt = AIService._buildPrompt(transactions, budgets, summary);

    try {
      const completion = await groq.chat.completions.create({
        model: config.groq.model,
        messages: [
          {
            role: 'system',
            content: `You are a senior financial advisor AI for AmakTech SmartExpense.
Your job is to analyze a user's financial data and provide clear, actionable insights.
Always respond in valid JSON only. No markdown. No extra text.
Be specific, realistic, and kind. Reference actual numbers from the data.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0].message.content;
      const parsed = JSON.parse(raw);

      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new AppError('AI returned an invalid response. Please try again.', 502);
      }
      if (err?.status === 429) {
        throw new AppError('AI service is temporarily busy. Please try again in a moment.', 429);
      }
      if (err?.status === 401) {
        throw new AppError('AI service configuration error. Please contact support.', 503);
      }
      throw new AppError(`AI service error: ${err.message}`, 502);
    }
  },

  async chat(userId, userMessage) {
    const [transactions, budgets, summary] = await Promise.all([
      TransactionRepository.getRecentForAI(userId, 20),
      BudgetRepository.getForAI(userId),
      TransactionRepository.getSummary(userId),
    ]);

    const contextSummary = `
User Financial Context:
- Total Income: ${summary.totalIncome}
- Total Expenses: ${summary.totalExpense}
- Current Balance: ${summary.balance}
- Active Budgets: ${budgets.length}
- Recent Transactions (last 20): ${JSON.stringify(transactions.map(t => ({
  type: t.type,
  amount: Number(t.amount),
  category: t.category,
  date: t.date,
})))}
    `.trim();

    try {
      const completion = await groq.chat.completions.create({
        model: config.groq.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful financial advisor AI for AmakTech SmartExpense.
You have access to the user's financial data below. Answer their question concisely and helpfully.
Be specific — reference actual numbers when relevant. Be encouraging and constructive.

${contextSummary}`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.5,
        max_tokens: 600,
      });

      return {
        reply: completion.choices[0].message.content,
        tokensUsed: completion.usage?.total_tokens,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err?.status === 429) throw new AppError('AI service busy. Please retry shortly.', 429);
      throw new AppError(`AI service error: ${err.message}`, 502);
    }
  },

  _buildPrompt(transactions, budgets, summary) {
    const txList = transactions.map(t => ({
      type:     t.type,
      amount:   Number(t.amount),
      category: t.category,
      date:     new Date(t.date).toISOString().slice(0, 10),
    }));

    const budgetList = budgets.map(b => ({
      category:    b.category,
      limit:       Number(b.limit),
      spent:       Number(b.spent),
      percentUsed: b.limit > 0 ? Math.round((Number(b.spent) / Number(b.limit)) * 100) : 0,
      daysLeft:    Math.max(0, Math.ceil((new Date(b.endDate) - new Date()) / 86400000)),
    }));

    return `
Analyze the following financial data and return a JSON object with this exact structure:
{
  "overallHealthScore": <number 0-100>,
  "healthLabel": "<Excellent|Good|Fair|Poor>",
  "summary": "<2-3 sentence overall financial health summary with specific numbers>",
  "insights": [
    {
      "type": "<spending|saving|budget|trend|warning>",
      "title": "<short insight title>",
      "description": "<detailed insight with specific numbers and percentages>",
      "severity": "<info|warning|critical>"
    }
  ],
  "recommendations": [
    "<specific, actionable recommendation with target amounts or percentages>"
  ],
  "topSpendingCategory": "<category name>",
  "savingsRate": <percentage of income saved as a number>,
  "projections": {
    "endOfMonthBalance": <projected balance number>,
    "budgetsAtRisk": ["<list of budget category names that may be exceeded>"]
  }
}

Provide 4-6 insights and 3-5 recommendations. Be specific about numbers.

FINANCIAL DATA:
- Total Income:  ${summary.totalIncome}
- Total Expenses: ${summary.totalExpense}
- Net Balance:   ${summary.balance}
- Income Transactions: ${summary.incomeCount}
- Expense Transactions: ${summary.expenseCount}

RECENT TRANSACTIONS (last 30):
${JSON.stringify(txList, null, 2)}

ACTIVE BUDGETS:
${JSON.stringify(budgetList, null, 2)}
`.trim();
  },
};
