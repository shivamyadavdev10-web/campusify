import { AxiosError } from 'axios';

export const getErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred.';

  // Check if it's an Axios Error
  if (error.isAxiosError) {
    const axiosError = error as AxiosError<any>;

    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    if (!axiosError.response) {
      return 'Cannot reach server. Check your internet connection.';
    }

    const { status, data } = axiosError.response;

    // Use server message if available
    const serverMessage = data?.message;

    switch (status) {
      case 400:
        return serverMessage || 'Invalid request.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return serverMessage || 'Access denied.';
      case 404:
        return 'Not found.';
      case 422:
        return serverMessage || 'Validation error.';
      case 429:
        return 'Too many requests. Please wait a moment.';
      default:
        if (status >= 500) {
          return 'Server error. Please try again later.';
        }
        return serverMessage || 'An unexpected error occurred.';
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback
  return 'An unexpected error occurred.';
};
