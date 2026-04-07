/**
 * JWT Token 验证工具
 * 主动检查 token 的过期状态，而不是被动等待后端 401
 */

export interface TokenPayload {
  Id: number;
  Uuid: string;
  Username: string;
  exp: number; // 过期时间戳（秒）
  iat: number; // 签发时间戳（秒）
  [key: string]: any;
}

/**
 * 解码 JWT Token (不验证签名，只解码载荷)
 * @param token JWT token 字符串
 * @returns 解码后的 payload，或 null 如果解码失败
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
};

/**
 * 检查 token 是否已过期
 * @param token JWT token 字符串
 * @returns true 表示已过期，false 表示未过期或无法判断
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  // exp 是秒级时间戳，需要转换为毫秒
  const expiresAt = payload.exp * 1000;
  const now = Date.now();

  // 如果剩余时间小于 5 秒，认为已过期（提前 5 秒触发，防止时序问题）
  return now >= expiresAt - 5000;
};

/**
 * 获取 token 的剩余有效期（秒）
 * @param token JWT token 字符串
 * @returns 剩余秒数，负数表示已过期，null 表示无法获取
 */
export const getTokenTimeRemaining = (token: string | null): number | null => {
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  return Math.ceil((expiresAt - now) / 1000);
};

/**
 * 检查并处理 token 过期
 * 如果 token 过期，清除认证信息并触发登出事件
 * @returns true 表示 token 过期且已处理，false 表示 token 仍有效
 */
export const checkAndHandleTokenExpiry = (): boolean => {
  const token = localStorage.getItem('access_token');

  if (isTokenExpired(token)) {
    // 清除所有认证信息
    localStorage.removeItem('access_token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');

    // 触发登出事件，让其他组件同步状态
    window.dispatchEvent(new CustomEvent('auth:logout'));
    window.dispatchEvent(new CustomEvent('token:expired'));

    return true;
  }

  return false;
};

/**
 * 获取 token 载荷中的用户信息
 * @param token JWT token 字符串
 * @returns 用户信息或 null
 */
export const getTokenUser = (
  token: string | null
): { id: number; username: string; uuid: string } | null => {
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    id: payload.Id || 0,
    username: payload.Username || '',
    uuid: payload.Uuid || '',
  };
};
