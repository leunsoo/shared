import { jwtDecode } from "jwt-decode";

/**
 * JWT Payload 타입 정의
 */
export interface JwtPayload {
  uuid: string;
  exp: number; // 만료 시간 (Unix timestamp, 초 단위)
  iat: number; // 발급 시간 (Unix timestamp, 초 단위)
  [key: string]: unknown;
}

/**
 * JWT 토큰에서 UUID 추출
 * @param token - JWT access 토큰
 * @returns UUID 문자열
 * @throws 잘못된 토큰 형식이거나 UUID가 없는 경우 에러 발생
 */
export const getUuidFromToken = (token: string): string => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    if (!decoded.uuid) {
      throw new Error("UUID not found in token");
    }

    return decoded.uuid;
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    throw new Error("Invalid token format");
  }
};

/**
 * JWT 토큰 만료 여부 확인
 * @param token - JWT access 토큰
 * @returns 만료되었으면 true, 아니면 false
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    if (!decoded.exp) {
      return true; // exp가 없으면 만료된 것으로 간주
    }

    // exp는 초 단위, Date.now()는 밀리초 단위이므로 1000을 곱함
    const currentTime = Date.now() / 1000;

    // 30초 버퍼를 둬서 만료 직전에 미리 갱신
    return decoded.exp - currentTime < 30;
  } catch (error) {
    console.error("Failed to check token expiration:", error);
    return true; // 에러 발생 시 만료된 것으로 간주
  }
};

/**
 * JWT 토큰 디코딩 (검증 없이 payload만 추출)
 * @param token - JWT 토큰
 * @returns 디코딩된 payload
 */
export const decodeToken = (token: string): JwtPayload => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error("Failed to decode token:", error);
    throw new Error("Invalid token format");
  }
};
