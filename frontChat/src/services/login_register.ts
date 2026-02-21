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