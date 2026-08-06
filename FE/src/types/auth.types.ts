export interface PurchasedCourse {
  _id: string;
  title: string;
  price: number;
  thumbnail?: string;
  semNumber: number;
  isPublished: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  accountType: string;
  isVerified: boolean;
  totalPurchased: number;
  myCourses: PurchasedCourse[];
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phoneNo: string;
  email: string;
  createPassword: string;
  confirmPassword: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  deviceId?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
