import { ApiClient } from '@/utils/axios';
export interface LoginReq {
  username: string;
  password: string;
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

const BASE_PATH = '/gateway/v1';

export const LoginRegisterService={
    async login(req:LoginReq){
        return await ApiClient.post<LoginRes>(`${BASE_PATH}/login`,req)
    },
    async register(req:RegisterReq){
        return await ApiClient.post<RegisterRes>(`${BASE_PATH}/register`,req)
    }
}