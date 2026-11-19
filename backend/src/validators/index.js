// Request Validation Utilities

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return phone.trim().length >= 8;
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
}

export function validateRegistrationInput(body) {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push('Full name is required.');
  if (!validateEmail(body.email)) errors.push('A valid email address is required.');
  if (!validatePhone(body.phone)) errors.push('A valid phone number is required.');
  if (!validatePassword(body.password)) errors.push('Password must be at least 8 characters.');

  const allowedRoles = ['donor', 'ngo', 'volunteer'];
  if (!body.role || !allowedRoles.includes(body.role)) {
    errors.push('Role must be one of: donor, ngo, volunteer.');
  }

  // Prevent self-registration as admin
  if (body.role === 'admin') {
    errors.push('Administrative accounts cannot be self-registered.');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateDonationInput(body) {
  const errors = [];
  if (!body.foodName || !body.foodName.trim()) errors.push('Food item name is required.');
  if (!body.category) errors.push('Food category is required.');
  if (typeof body.quantity !== 'number' || body.quantity <= 0) {
    errors.push('Quantity must be a positive number.');
  }
  if (!body.unit) errors.push('Quantity unit (kg, meals, etc.) is required.');

  if (!body.preparationTime || isNaN(new Date(body.preparationTime).getTime())) {
    errors.push('Valid preparation timestamp is required.');
  }
  if (!body.expiryTime || isNaN(new Date(body.expiryTime).getTime())) {
    errors.push('Valid expiry timestamp is required.');
  }

  const prep = new Date(body.preparationTime).getTime();
  const expiry = new Date(body.expiryTime).getTime();
  const now = Date.now();

  if (expiry <= prep) {
    errors.push('Expiry time must be later than preparation time.');
  }
  if (expiry <= now) {
    errors.push('Food has already expired and cannot be registered.');
  }

  if (!body.pickupAddress || !body.pickupAddress.street || !body.pickupAddress.street.trim()) {
    errors.push('Pickup address street is required.');
  }
  if (!body.pickupAddress || !body.pickupAddress.city || !body.pickupAddress.city.trim()) {
    errors.push('Pickup address city is required.');
  }

  return { isValid: errors.length === 0, errors };
}
