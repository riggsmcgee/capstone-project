// src/services/mockAiService.js
class MockAIService {
  async processCalendarInput(input) {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock formatted calendar data
    return `0/2024/10/29/0900-1700/2
  0/2024/10/30/1000-1500/2
  0/2024/10/31/0900-1700/3`;
  }

  async processAvailabilityQuery(query, calendars) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return 'Based on the calendars provided, the users are both available on Tuesday between 10:00 AM and 3:00 PM.';
  }
}

module.exports = new MockAIService();
