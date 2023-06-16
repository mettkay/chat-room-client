<template>
  <div class="common-layout">
    <div class="title-header">
      <div class="online">在线人数：{{ online }}</div>
      <h4>聊天室</h4>
      <div class="avatar-item" @click="showEditPlate">
        <el-image class="head-avatar" :src="user.avatar"></el-image>
      </div>
    </div>

    <div
      class="chat-content"
      :style="{ marginBottom: footerHeight + 'px' }"
      @click="showEmoji = false"
      v-if="msgList.length"
    >
      <div class="loading-plate" v-show="!page.last">
        <el-row v-loading="true"></el-row>
      </div>
      <div
        :class="item.uid == user.id ? 'self-item' : 'chat-item'"
        v-for="(item, i) in msgList"
        :key="i"
      >
        <el-image
          style="width: 1.5rem; height: 1.5rem"
          class="user-avatar"
          :src="item.avatar"
        ></el-image>
        <div class="chat-info" :class="item.uid == user.id ? 'self-info' : ''">
          <span class="user-nick">{{ item.nick }}</span>
          <span class="content" @click="agreeMessage(item.info)">{{ item.info }}</span>
          <span class="send-time">{{ showTime(item.createTime) }}</span>
        </div>
      </div>
    </div>

    <div class="edit-footer" id="footer">
      <div class="footer-top">
        <el-input
          size="large"
          v-model="msg"
          @focus="inputFocus"
          maxlength="100"
          @keydown="submitContent"
          class="msg-input"
          placeholder="Message"
        >
        </el-input>
        <div class="emoji-button">
          <span @click="showEmoji = !showEmoji">{{ emojiList[0] }}</span>
        </div>
        <el-button @click="sendMessage" class="send-button" type="primary">
          发送
        </el-button>
      </div>

      <div class="footer-emoji" :class="showEmoji ? 'ani-popup' : ''">
        <div class="emoji-header">
          <div class="emoji-title">{{ emojiList[0] }}</div>
        </div>
        <div class="emoji-list">
          <div
            class="emoji-item"
            @click="addEmoji(item)"
            v-for="(item, i) in emojiList"
            :key="i"
          >
            {{ item }}
          </div>
        </div>
      </div>
    </div>

    <div class="mask-plate" v-show="showEdit">
      <div class="user-plate">
        <div class="avatar-view" @click="randomAvatar">
          <el-image class="avatar-img" :src="user.tempAvatar"></el-image>
          <el-button class="random-avatar" :icon="RefreshRight">随机头像</el-button>
        </div>
        <div class="nick-view">
          <el-input v-model="user.tempNick" maxlength="10" placeholder="请输入昵称" />
        </div>
        <el-button class="btn-submit" type="primary" @click="submitUpdateUser">确定</el-button>
        <el-button class="close-icon" @click="showEdit = false" :icon="Close" circle />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, reactive, ref, computed, toRefs, onMounted, nextTick } from "vue";
import { formatDate, throttle } from "@/common/utils";
import { userLogin,getRandomAvatarUrl,updateUserInfo } from "@/service/user";
import { getInfo, addMessage } from "@/service/record";
import { inject } from "vue";
import { ElLoading, ElMessage } from "element-plus";
import {
  Close,
  RefreshRight
} from '@element-plus/icons-vue'
import emojiData from "@/assets/emoji";

const emojiList = emojiData.data.split(",");

const msg = ref("");
const user = ref({});
const msgList = ref([]);
const page = ref({
  pageSize: 20,
  pageIndex: 0,
  last: false,
});
const online = ref(0);
const showEmoji = ref(false);
const showEdit = ref(false)

const socket = inject("socket");

socket.on("broadcast_msg", (res) => {
  msgList.value.push(res.msg);
  updateScroll();
});

socket.on("broadcast_online", (res) => {
  online.value = res.online;
});


const footerHeight = ref(0);

watch(showEmoji, async (newValue, oldValue) => {
  await nextTick();
  footerHeight.value = document.getElementById("footer").offsetHeight;
  setTimeout(() => {
    updateScroll();
  }, 300);
});

onMounted(async () => {
  footerHeight.value = document.getElementById("footer").offsetHeight;

  let loading = ElLoading.service({
    lock: true,
    text: "Loading",
    background: "rgba(255, 255, 255, 0.8)",
  });

  user.value = await userLogin();
  socket.emit("login", user.value);

  const res = await getInfo(page.value).then((res) => res);
  if (res.data.data.length < page.value.pageSize) {
    page.value.last = true;
  } else {
    page.value.last = false;
  }
  msgList.value = res.data.data;

  await updateScroll(loading);
  await nextTick();

  setTimeout(() => {
    window.addEventListener("scroll", throttle(scrollTop, 1000), true);
  }, 1000);
});

const showTime = (strTime) => formatDate(strTime);

const sendMessage = () => {
  if (!msg.value) {
    return;
  }
  if (msg.value.length > 100) {
    ElMessage({
      message:"输入的值不能超过100个字符哦~",
      type:'warning'
    });
    return;
  }
  let msgtemp = {
    createTime: new Date().getTime(),
    info: msg.value,
    avatar: user.value.avatar,
    nick: user.value.nick,
    uid: user.value.id,
  };

  socket.emit("send_msg", msgtemp);
  msg.value = "";
};

const agreeMessage = (agreeVal)=>{
  let msgtemp = {
    createTime: new Date().getTime(),
    info: agreeVal,
    avatar: user.value.avatar,
    nick: user.value.nick,
    uid: user.value.id,
  };

  socket.emit("send_msg", msgtemp);
}

const addEmoji = (item) => {
  msg.value = msg.value + item;
};

const submitContent = (e) => {
  if (e.key == "Enter") {
    sendMessage();
  }
};

const showEditPlate = ()=>{
  user.value.tempAvatar = user.value.avatar;
  user.value.tempNick = user.value.nick;
  showEdit.value = true
}

const scrollTop = async () => {
  let scroll = document.documentElement.scrollTop || document.body.scrollTop;
  if (page.value.last) {
    return;
  }
  if (scroll < 10) {
    let oldHeight = document.body.scrollHeight;

    page.value.pageIndex++;
    const res = await getInfo(page.value).then((res) => res);
    let data = res.data.data;
    if (data.length < page.value.pageSize) {
      page.value.last = true;
    }
    msgList.value.unshift(...data);

    setTimeout(() => {
      let newHeight = document.body.scrollHeight;
      window.scrollTo(0, newHeight - oldHeight);
    }, 10);
  }
};

const inputFocus = () => {
  showEmoji.value = false;
  updateScroll();
};

const updateScroll = (loading) => {
  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
    if (loading) {
      loading.close();
    }
  }, 200);
};

const randomAvatar = () => {
  user.value.tempAvatar = getRandomAvatarUrl()
};

const submitUpdateUser = async () =>{
  if(!user.value.tempNick.trim()){
    ElMessage({
      message:"昵称不能为空哦~",
      type:'warning'
    });
    return
  }
  showEdit.value = false
  user.value.avatar = user.value.tempAvatar
  user.value.nick = user.value.tempNick.trim()
  let uid = await updateUserInfo(user.value)
  msgList.value.filter(e=>e.uid == uid).forEach(e=>{
    e.avatar = user.value.avatar
    e.nick = user.value.nick
  })
}

</script>

<style lang="scss" scoped>
// .common-layout {
//   background: #333;
// }

.title-header {
  width: 100%;
  height: 3rem;
  padding: 0 1rem;
  background: #fff;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  box-sizing: border-box;
  z-index: 1000;
  box-shadow: 0 1px 0px 1px rgb(116 116 116 / 10%);

  .online {
    font-size: 0.5rem;
    width: 4rem;
  }

  .avatar-item {
    width: 4rem;
    display: flex;
    justify-content: flex-end;
  }

  .head-avatar {
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid #00000066;
    border-radius: 50%;
    padding: 0.2rem;
  }
}

.chat-content {
  margin-top: 4rem;
  transition: all 0.3s;

  .loading-plate {
    padding-top: 2rem;
    height: 2rem;
  }

  .chat-item {
    padding: 0.5rem 0.5rem;
    display: flex;
  }

  .self-item {
    padding: 0.5rem 0.5rem;
    display: flex;
    // justify-content: flex-start;
    flex-direction: row-reverse;

    .user-nick {
      text-align: end;
    }
  }

  .user-avatar {
    background: #fff;
    border-radius: 50%;
    padding: 0.3rem;
  }

  .chat-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 85%;
    margin: 0 0.5rem;
    overflow: hidden;
    .user-nick {
      color: #aaa;
      font-size: 0.5rem;
    }

    .content {
      background: #fff;
      padding: 0.5rem;
      color: rgb(8, 143, 3);
      margin-top: 0.2rem;
      border-radius: 0.2rem;
      font-size: 0.8rem;
      max-width: 85%;
      word-break: break-all;
    }

    .send-time {
      color: #b2b2b2;
      margin-top: 0.2rem;
      font-size: 0.3rem;
    }
  }

  .self-info {
    align-items: flex-end;
  }
}

.edit-footer {
  width: 100%;
  box-sizing: border-box;
  position: fixed;
  bottom: 0;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 -1px 0px 1px rgb(116 116 116 / 10%);

  .footer-top {
    width: 100%;
    height: 3rem;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.5rem;
    box-sizing: border-box;
    .msg-input {
      width: 70%;
      height: 2rem;
      font-size: 0.8rem;
    }

    .send-button {
      width: 16%;
      height: 1.6rem;
      margin-left: 0;
    }

    .emoji-button {
      font-size: 1rem;
      padding: 0.3rem;
    }
    .emoji-button:active {
      background: #fff;
    }
  }

  .footer-emoji {
    width: 100%;
    height: 0;
    transform: translateY(100%);
    transition: 0.3s;
    .emoji-header {
      display: flex;
      align-items: center;
      padding: 0 0.5rem 0.5rem;

      .emoji-title {
        padding: 0.3rem;
        border-radius: 0.3rem;
        background: #fff;
      }
    }

    .emoji-list {
      background: #eee;
      width: 100%;
      height: 10rem;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      padding: 0.5rem;
      overflow: auto;
      justify-content: space-between;
      box-sizing: border-box;
      .emoji-item {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.3rem;
      }

      .emoji-item:active {
        background: #fff;
      }
    }
  }

  .ani-popup {
    height: auto;
    transform: translateY(0);
  }
}

.mask-plate {
  width: 100%;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;

  .user-plate {
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 0.3rem;
    width: 15rem;
    padding: 2rem 0;
    position: relative;

    .close-icon{
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }
  }

  .avatar-view {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .avatar-img {
      width: 5rem;
      height: 5rem;
      border: 2rpx solid #999;
    }

    .random-avatar {
      margin-top: 1rem;
    }
  }

  .nick-view{
    margin-top: 1rem;
  }
  .btn-submit {
    margin-top: 1rem;
    width: 10rem;
    height: 2rem;
  }
}
</style>
