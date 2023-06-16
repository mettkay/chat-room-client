import { getRecord,addRecord } from "../api/record"

const getInfo = page => {
  return new Promise((resolve,reject)=>{
    resolve(getRecord(page))
  })
}

const addMessage = record => {
  return new Promise((resolve,reject)=>{
    resolve(addRecord(record))
  })
}

export {
  getInfo,
  addMessage
}