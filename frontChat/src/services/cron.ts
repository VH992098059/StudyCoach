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

export interface CronRunReq {
    id: number;
}

export interface CronRunRes {
    is_ok: string;
}

export interface CronExecuteListReq {
    cron_name_fk: string;
    page: number;
    size: number;
}

export interface CronExecute {
    id: number;
    cron_id: number;
    cronId?: number; // Compatible with camelCase
    cron_name_fk: string;
    cronNameFk?: string; // Compatible with camelCase
    execute_time: string;
    executeTime?: string; // Compatible with camelCase
    next_time?: string;
    nextTime?: string; // Compatible with camelCase
    status: number; // 执行状态：0=执行中，1=成功，2=失败
    error_message?: string;
    errorMessage?: string; // Compatible with camelCase
    duration?: number; // 执行耗时（毫秒）
    created_at: string;
    createdAt?: string; // Compatible with camelCase
    updated_at: string;
    updatedAt?: string; // Compatible with camelCase
}

export interface CronLog {
    id: number;
    execute_id: number;
    executeId?: number; // Compatible with camelCase
    cron_id: number;
    cronId?: number; // Compatible with camelCase
    cron_name_fk: string;
    cronNameFk?: string; // Compatible with camelCase
    content: string;
    level: string;
    create_time: string;
    createTime?: string; // Compatible with camelCase
}

export interface CronExecuteListByCronIdReq {
    cronId: number;
    page: number;
    size: number;
}

export interface CronExecuteListByCronIdRes {
    list: CronExecute[];
    total: number;
}

export interface CronExecuteDetailReq {
    id: number;
}

export interface CronExecuteDetailRes extends CronExecute {}

export interface CronExecuteLogReq {
    executeId: number;
    page: number;
    size: number;
}

export interface CronExecuteLogRes {
    list: CronLog[];
    total: number;
}

export interface CronExecuteListRes {
    list: CronExecute[];
    total: number;
}

export const CronService = {
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
    },
    run: (data: CronRunReq) => {
        return http.post<CronRunRes>('/gateway/v1/cronRun', data);
    },
    listLogs: (params: CronExecuteListReq) => {
        return http.get<CronExecuteListRes>('/gateway/v1/cronExecuteList', params);
    },
    listByCronId: (params: CronExecuteListByCronIdReq) => {
        return http.get<CronExecuteListByCronIdRes>('/gateway/v1/cronExecuteListByCronId', params);
    },
    getExecuteDetail: (params: CronExecuteDetailReq) => {
        return http.get<CronExecuteDetailRes>('/gateway/v1/cronExecuteDetail', params);
    },
    getExecuteLogs: (params: CronExecuteLogReq) => {
        return http.get<CronExecuteLogRes>('/gateway/v1/cronExecuteLog', params);
    }
};
