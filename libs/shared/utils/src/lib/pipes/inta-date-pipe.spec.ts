import { IntaDatePipe } from './inta-date-pipe';

describe('IntaDatePipe', () => {
  let pipe: IntaDatePipe;
  beforeEach(() => {
    pipe = new IntaDatePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format ISO string to dd-MM-yyyy', () => {
    expect(pipe.transform('2024-02-01T00:00:00Z')).toBe('01/02/2024');
  });

  it('should format Date object to dd-MM-yyyy', () => {
    expect(pipe.transform(new Date('2024-02-01T00:00:00Z'))).toBe('01/02/2024');
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(pipe.transform('not-a-date')).toBe('');
  });
});
