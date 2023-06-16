import request from '../common/request'

export const login = (uuid:string) => request.post('/api/login',{uuid})

export const register = (params:object) => request.post('/api/reguser',params)

export const updateUser = (params:object) => request.post('/api/updateUser',params)