// services/aiService.js
const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processCalendarInput(input) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a calendar processing assistant. Convert the following calendar input into the standardized format:
            style/year/month/day/start_time–end_time/availability
            OR
            style/start_year/start_month/start_day/start_time–end_year/end_month/end_day/end_time/availability
            
            Availability levels:
            3 = available and preferred
            2 = available
            1 = available and not preferred
            0 = not available
            
            Return only the formatted entries, one per line.`,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        temperature: 0,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI Calendar Processing Error:', error);
      throw new Error('Failed to process calendar input');
    }
  }

  async processAvailabilityQuery(query, calendars) {
    try {
      const formattedCalendars = calendars.map((calendar) => ({
        username: calendar.user.username,
        availability: calendar.availability,
      }));

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a scheduling assistant. Analyze the provided calendars and answer questions about user availability. 
            Consider all availability levels:
            3 = available and preferred
            2 = available
            1 = available and not preferred
            0 = not available
            
            Provide clear, concise responses about when users can meet.`,
          },
          {
            role: 'user',
            content: `Calendars: ${JSON.stringify(
              formattedCalendars
            )}\n\nQuery: ${query}`,
          },
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI Query Processing Error:', error);
      throw new Error('Failed to process availability query');
    }
  }
}

module.exports = new AIService();
