import { login, register,updateUser } from '../api/user'
import { getUuid, getStorage, setStorage } from '../common/utils'
import avatarList from '../assets/avatarList.json'


export const userLogin = () => {
  return new Promise((resolve, reject) => {
    let uuid = getStorage('uuid')

    if (uuid) {
      login(uuid).then(res => {
        const user = res.data.data
        if (!user) {
          let params = initRegister()

          register(params).then(res => {
            const user = res.data.data
            resolve(user)
          })
        }
        resolve(user)
      })
    } else {
      let params = initRegister()

      register(params).then(res => {
        const user = res.data.data
        resolve(user)
      })
    }

  })
}


export const updateUserInfo = (user:any) =>{
  return new Promise((resolve, reject) => {
    updateUser(user).then(res=>{
      resolve(user.id)
    })
  })
}

const initRegister = () => {
  let uuid = getUuid()

  setStorage('uuid', uuid)

  let avatar = getRandomAvatarUrl()

  let nick = '路人' + Math.floor(Math.random() * 1000)

  return { uuid, avatar, nick }
}

export const getRandomAvatarUrl = () => {
  return avatarList[Math.floor(Math.random() * avatarList.length)]
}