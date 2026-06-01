import { HttpContextToken } from '@angular/common/http';

export const SKIP_ERROR_TOAST = new HttpContextToken(() => false);
export const SKIP_CENTER_INTERCEPTOR = new HttpContextToken(() => false);

interface ToastMessage {
  title?: string;
  message: string;
  titleError?: string;
  messageError?: string;
}
export const TOAST_FEEDBACK = new HttpContextToken<ToastMessage>(() => ({
  message: 'TOAST.DEFAULT_POST_MESSAGE',
  title: 'TOAST.DEFAULT_POST_TITLE',
  titleError: 'TOAST.DEFAULT_ERROR_TITLE',
  messageError: 'TOAST.DEFAULT_ERROR_MESSAGE',
}));
