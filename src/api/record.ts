import request from '../common/request'

export const getRecord = page => request.get('/api/getRecord',{params:page})

export const addRecord = (record:object) => request.post('/api/addRecord',record)

