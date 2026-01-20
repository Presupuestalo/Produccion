export function translateAuthError(error: string): string {
  const errorTranslations: Record<string, string> = {
    // Password errors
    "New password should be different from the old password": "La nueva contraseña debe ser diferente a la anterior",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
    "Password is too weak": "La contraseña es demasiado débil",
    "Invalid password": "Contraseña inválida",

    // Email errors
    "Invalid email": "Correo electrónico inválido",
    "Email not confirmed": "Correo electrónico no confirmado",
    "User not found": "Usuario no encontrado",
    "User already registered": "El usuario ya está registrado",
    "Email already registered": "El correo electrónico ya está registrado",
    "Invalid email or password": "Correo electrónico o contraseña incorrectos",

    // Session errors
    "Auth session missing!": "Sesión de autenticación faltante",
    "Invalid session": "Sesión inválida",
    "Session expired": "Sesión expirada",
    "No session found": "No se encontró sesión",

    // Token errors
    "Invalid token": "Token inválido",
    "Token expired": "Token expirado",
    "Invalid refresh token": "Token de actualización inválido",

    // Rate limiting
    "Too many requests": "Demasiadas solicitudes",
    "Rate limit exceeded": "Límite de velocidad excedido",

    // Network errors
    "Network error": "Error de red",
    "Unable to validate email address: invalid format": "No se puede validar la dirección de correo: formato inválido",

    // Generic errors
    "Something went wrong": "Algo salió mal",
    "An error occurred": "Ocurrió un error",
    "Internal server error": "Error interno del servidor",
    "Service unavailable": "Servicio no disponible",

    // Signup errors
    "Signup disabled": "Registro deshabilitado",
    "Email signup disabled": "Registro por correo deshabilitado",

    // Login errors
    "Invalid login credentials": "Credenciales de inicio de sesión inválidas",
    "Account not found": "Cuenta no encontrada",
    "Account locked": "Cuenta bloqueada",

    // Reset password errors
    "Unable to process request": "No se puede procesar la solicitud",
    "Password reset not allowed": "Restablecimiento de contraseña no permitido",

    // Verification errors
    "Email verification required": "Verificación de correo electrónico requerida",
    "Phone verification required": "Verificación de teléfono requerida",

    // Database errors
    "Database error": "Error de base de datos",
    "Connection error": "Error de conexión",

    // Permission errors
    "Insufficient permissions": "Permisos insuficientes",
    "Access denied": "Acceso denegado",
    Unauthorized: "No autorizado",

    // Validation errors
    "Invalid input": "Entrada inválida",
    "Required field missing": "Campo requerido faltante",
    "Invalid format": "Formato inválido",

    // Two-factor authentication
    "Invalid verification code": "Código de verificación inválido",
    "Verification code expired": "Código de verificación expirado",

    // OAuth errors
    "OAuth error": "Error de OAuth",
    "Provider error": "Error del proveedor",

    // Account errors
    "Account suspended": "Cuenta suspendida",
    "Account deleted": "Cuenta eliminada",
    "Account not activated": "Cuenta no activada",
  }

  // Buscar traducción exacta
  if (errorTranslations[error]) {
    return errorTranslations[error]
  }

  // Buscar traducción parcial (para errores que contienen texto variable)
  for (const [englishError, spanishError] of Object.entries(errorTranslations)) {
    if (error.toLowerCase().includes(englishError.toLowerCase())) {
      return spanishError
    }
  }

  // Si no se encuentra traducción, devolver el error original
  return error
}
