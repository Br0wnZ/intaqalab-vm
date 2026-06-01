type FeedbackOperation = 'TRIAL';
export interface FeedbackDefinition {
  operation: FeedbackOperation;
  type: 'GET' | 'CREATE' | 'UPDATE' | 'DELETE';
}
