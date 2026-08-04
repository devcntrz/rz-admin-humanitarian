import bcrypt from 'bcryptjs'

/**
 * Hash password menggunakan bcrypt
 * @param password Password plain text
 * @returns Promise<string> Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verifikasi password dengan hash
 * @param password Password plain text
 * @param hash Hashed password
 * @returns Promise<boolean> True jika password valid
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Validasi format email
 * @param email Email address
 * @returns boolean True jika format email valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validasi kekuatan password
 * @param password Password plain text
 * @returns object { isValid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password minimal 8 karakter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter khusus')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
