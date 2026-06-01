import { getStartEndOfWeek } from './dates-utils.functions';

describe('getWeekRange', () => {
  it('should return the correct start and end of the week for a given date', () => {
    const date = new Date('2025,10,24');
    const result = getStartEndOfWeek(date);
    expect(result).toEqual({ end: '2025-10-26', start: '2025-10-20' });
  });
});
