import http from '@/utils/axios';

export interface CronCreateReq {
    cron_name: string;
    knowledge_base_name: string;
    scheduling_method: string;
    cron_expression: string;
    status: number;
    content_type: number;
}

export interface CronCreateRes {
    id: number;
}

export interface CronDeleteReq {
    id: number;
}

export interface CronDeleteRes {
    is_ok: string;
}

export interface CronListReq {
    page: number;
    size: number;
}

export interface KnowledgeBaseCronSchedule {
    id: number;
    cron_name: string;
    cronName?: string; // Compatible with camelCase
    knowledge_base_name: string;
    knowledgeBaseName?: string; // Compatible with old backend response
    scheduling_method: string;
    schedulingMethod?: string; // Compatible with camelCase
    cron_expression: string;
    cronExpression?: string; // Compatible with camelCase
    status: number;
    content_type: number;
    contentType?: number; // Compatible with camelCase
    created_at: string;
    createdAt?: string; // Compatible with camelCase
    updated_at: string;
    updatedAt?: string; // Compatible with camelCase
    deleted_at?: string;
    deletedAt?: string; // Compatible with camelCase
}

export interface CronListRes {
    list: KnowledgeBaseCronSchedule[];
}

export interface CronGetOneReq {
    id: number;
}

export interface CronGetOneRes {
    one: KnowledgeBaseCronSchedule;
}

export interface CronUpdateOneReq {
    id: number;
    cron_name?: string;
    knowledge_base_name?: string;
    scheduling_method?: string;
    cron_expression?: string;
    status?: number;
    content_type?: number;
}

export interface CronUpdateOneRes {
    is_ok: string;
}

export interface CronUpdateOneStatusReq {
    id: number;
    status: number;
}

export interface CronUpdateOneStatusRes {
    is_ok: string;
}

export const cronService = {
    create: (data: CronCreateReq) => {
        return http.post<CronCreateRes>('/gateway/v1/cronCreate', data);
    },
    delete: (data: CronDeleteReq) => {
        return http.delete<CronDeleteRes>('/gateway/v1/cronDelete', { data });
    },
    list: (params: CronListReq) => {
        return http.get<CronListRes>('/gateway/v1/cronList', params);
    },
    getOne: (params: CronGetOneReq) => {
        return http.get<CronGetOneRes>('/gateway/v1/cronGetOne', params);
    },
    updateOne: (data: CronUpdateOneReq) => {
        return http.put<CronUpdateOneRes>('/gateway/v1/cronUpdateOne', data);
    },
    updateOneStatus: (data: CronUpdateOneStatusReq) => {
        return http.put<CronUpdateOneStatusRes>('/gateway/v1/cronUpdateOneStatus', data);
    }
};
