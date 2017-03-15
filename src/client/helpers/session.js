import AppConfig from '../config/appConfig';
import storage from '../services/storage';

/**
 * Save user token to storage
 * @param  {string} token - user token
 */
export function saveUserToken(token) {
    return storage.setItem(AppConfig.USER_TOKEN_STORAGE_KEY, token);
}

/**
 * Get user token from storage
 * @return {string} user token
 */
export function getUserToken(cookies) {
    return storage.getItem(AppConfig.USER_TOKEN_STORAGE_KEY, cookies);
}

/**
 * Remove user token from storage
 */
export function removeUserToken() {
    return storage.removeItem(AppConfig.USER_TOKEN_STORAGE_KEY);
}
