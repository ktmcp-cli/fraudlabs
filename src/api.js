import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.fraudlabspro.com/v3';

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401) {
      throw new Error('Authentication failed. Check your API key: fraudlabs config set --api-key <key>');
    } else if (status === 403) {
      throw new Error('Access forbidden. Check your API permissions.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    } else {
      const message = data?.message || data?.error || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from FraudLabs API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// ORDER SCREENING
// ============================================================

export async function screenOrder({
  ipAddress, orderId, amount, currency, quantity,
  paymentMethod, cardNumber, cardHash,
  email, emailHash,
  firstName, lastName, phone,
  billingAddress, billingCity, billingState, billingCountry, billingZip,
  shippingAddress, shippingCity, shippingState, shippingCountry, shippingZip
} = {}) {
  try {
    const apiKey = getConfig('apiKey');
    const params = {
      key: apiKey,
      format: 'json'
    };
    if (ipAddress) params.ip = ipAddress;
    if (orderId) params.order_id = orderId;
    if (amount) params.amount = amount;
    if (currency) params.currency = currency;
    if (quantity) params.quantity = quantity;
    if (paymentMethod) params.payment_method = paymentMethod;
    if (cardNumber) params.card_number = cardNumber;
    if (cardHash) params.card_hash = cardHash;
    if (email) params.email = email;
    if (emailHash) params.email_hash = emailHash;
    if (firstName) params.first_name = firstName;
    if (lastName) params.last_name = lastName;
    if (phone) params.phone = phone;
    if (billingAddress) params.bill_addr = billingAddress;
    if (billingCity) params.bill_city = billingCity;
    if (billingState) params.bill_state = billingState;
    if (billingCountry) params.bill_country = billingCountry;
    if (billingZip) params.bill_zip = billingZip;
    if (shippingAddress) params.ship_addr = shippingAddress;
    if (shippingCity) params.ship_city = shippingCity;
    if (shippingState) params.ship_state = shippingState;
    if (shippingCountry) params.ship_country = shippingCountry;
    if (shippingZip) params.ship_zip = shippingZip;

    const response = await axios.get(`${BASE_URL}/order/screen`, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// FEEDBACK
// ============================================================

export async function submitFeedback({ fraudId, action, note } = {}) {
  try {
    const apiKey = getConfig('apiKey');
    const params = {
      key: apiKey,
      format: 'json',
      id: fraudId,
      action,
    };
    if (note) params.note = note;
    const response = await axios.get(`${BASE_URL}/order/feedback`, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// SMS VERIFICATION
// ============================================================

export async function sendSmsVerification({ tel, countryCode, mesgType } = {}) {
  try {
    const apiKey = getConfig('apiKey');
    const params = {
      key: apiKey,
      format: 'json',
      tel,
      country_code: countryCode,
      mesg_type: mesgType || 'SMS'
    };
    const response = await axios.get(`${BASE_URL}/verification/send`, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function verifySmsCode({ tel, otp } = {}) {
  try {
    const apiKey = getConfig('apiKey');
    const params = {
      key: apiKey,
      format: 'json',
      tel,
      otp
    };
    const response = await axios.get(`${BASE_URL}/verification/verify`, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}
