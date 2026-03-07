import { ApiClient } from '@/utils/axios';

/** 未登录时的会话消息 */
export interface AnonymousMessage {
  id?: number;
  msg_id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

/** 未登录时的会话，登录后由后端合并到用户历史 */
export interface AnonymousSession {
  id: string;
  title: string;
  messages: AnonymousMessage[];
}

export interface LoginReq {
  username: string;
  password: string;
  /** 未登录时的会话，登录后由后端合并 */
  anonymousSessions?: AnonymousSession[];
}
export interface LoginRes {
    id:number
	uuid:string
    token: string;
}

export interface RegisterReq {
    username: string;
    password: string;
    email: string;
}

export interface RegisterRes{
    id:number;
}

export interface LogoutRes {
    msg: string;
}

const BASE_PATH = '/gateway/users';

export interface UpdatePasswordReq {
    oldPassword: string;
    newPassword: string;
}

export const LoginRegisterService={
    async login(req:LoginReq){
        return await ApiClient.post<LoginRes>(`${BASE_PATH}/login`,req)
    },
    async register(req:RegisterReq){
        return await ApiClient.post<RegisterRes>(`${BASE_PATH}/register`,req)
    },
    async logout(){
        return await ApiClient.post<LogoutRes>(`${BASE_PATH}/logout`)
    },
    async updatePassword(req: UpdatePasswordReq){
        return await ApiClient.post<any>(`${BASE_PATH}/update_password`, req)
    }
}