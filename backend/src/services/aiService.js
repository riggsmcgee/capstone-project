const { Configuration, OpenAIApi } = require('openai');

class AIService {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async processCalendarInput(input) {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a calendar processing assistant. Convert the following calendar input into the standardized format:

             {"friday":["9:00-13:00"],"monday":["9:00-12:00","13:00-17:00"],"tuesday":["10:00-15:00"],"thursday":["13:00-18:00"],"wednesday":["9:00-17:00"]}
            
            Return only the formatted entries.`,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        temperature: 0,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(
        'AI Calendar Processing Error:',
        error.response?.data || error.message
      );
      throw new Error('Failed to process calendar input');
    }
  }

  async processAvailabilityQuery(query, calendars) {
    try {
      const formattedCalendars = calendars.map((calendar) => {
        if (!calendar.user || !calendar.user.username) {
          throw new Error(
            `Calendar for userId ${calendar.userId} is missing username.`
          );
        }

        if (typeof calendar.availability !== 'string') {
          throw new Error(
            `Availability for user ${calendar.user.username} must be a string.`
          );
        }

        return {
          username: calendar.user.username,
          availability: calendar.availability,
        };
      });

      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a scheduling assistant. Analyze the provided calendars and answer questions about user availability. 
            
            Provide clear, concise responses about when users can meet. Use the 12 hour clock and offer as many options as possible (max 5).`,
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

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(
        'AI Query Processing Error:',
        error.response?.data || error.message
      );
      throw new Error('Failed to process availability query');
    }
  }
}

module.exports = new AIService();
