export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.trim());
};

export const isValidPassword = (password: string | null | undefined): boolean => {
  return password ? password.length >= 6 : false;
};

export const isValidName = (name: string | null | undefined): boolean => {
  return name ? name.trim().length >= 2 : false;
};

export const isValidOTP = (otp: string | null | undefined): boolean => {
  if (!otp) return false;
  const otpRegex = /^[0-9]{6}$/;
  return otpRegex.test(otp.trim());
};

export interface RegistrationForm {
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  email?: string;
  createPassword?: string;
  confirmPassword?: string;
}

export const validateRegistrationForm = (form: RegistrationForm) => {
  let errors: Record<string, string> = {};
  
  if (!isValidName(form.firstName)) errors.firstName = "Min 2 characters required";
  if (!isValidName(form.lastName)) errors.lastName = "Min 2 characters required";
  if (!isValidPhone(form.phoneNo)) errors.phoneNo = "Must be 10-15 digits";
  if (!isValidEmail(form.email)) errors.email = "Invalid email format";
  if (!isValidPassword(form.createPassword)) errors.createPassword = "Min 6 characters required";
  if (form.createPassword !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};