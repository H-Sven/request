/*
 * @Author: Siwen
 * @Date: 2019-08-08 13:47:01
 * @LastEditors: Siwen
 * @LastEditTime: 2020-07-22 15:18:38
 * @Description: axios封装
 */
import axios from 'axios'
import qs from 'qs'
import store from '@/store'
// import VueRoute from '@/router'
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.VUE_APP_API_URL
// 公共参数
const publicParams = {
  token: 'token'
}

// 防止重复请求相关配置
const pending = []
const CancelToken = axios.CancelToken
const cancelPending = (config) => {
  pending.forEach((item, index) => {
    if (!config || item.UrlPath === config.url) {
      item.Cancel() //取消请求
      pending.splice(index, 1) //移除当前请求记录
    }
  })
}
//不进行防重处理的接口集合
const noCancelPending = []

//request 拦截器
axios.interceptors.request.use(
  config => {
    if (!config.headers['AHost'] && !config.url.includes('fabu')) {
      config.headers['AHost'] = 'commonServer' // 定制AHost:futures or 通用AHost:commonServer
    }
    // 防止重复请求 ↓↓↓↓
    if (!noCancelPending.includes(config.url)) {
      cancelPending(config)
      config.cancelToken = new CancelToken((res) => {
        pending.push({ 'UrlPath': config.url, 'Cancel': res })
      })
    }
    // 防止重复请求 ↑↑↑↑
    if (config.method === 'post' && config.url.indexOf('uploadResource') === -1) { // 非上传post请求
      config.data = qs.stringify(Object.assign(config.data || {}, publicParams))
    } else if (config.method === 'get') {
      config.params = Object.assign(config.params || {}, publicParams)
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)
//response 拦截器
// const routePath = ['/', '/login', '/register', '/forgot']
axios.interceptors.response.use(
  response => {
    cancelPending(response.config) // 防止重复请求
    // 具体业务处理
    const res = response.data
    if (typeof res === 'string') {
      return res
    } else if (!res.success) {
      if (res.error.code === 2003 || res.error.code === 2000 || res.error.code === 2016 || res.error.code === 1018) {
        store.commit('SET_LOGIN', false)
        store.commit('SET_INFO', {
          nickName: '点击登录'
        })
      }
      // if (!routePath.includes(VueRoute.currentRoute.path)) {
      //   VueRoute.push({ path: '/login' })
      // }
      return Promise.reject(res.error)
    } else if (res.data) {
      return res.data
    } else {
      return res.payload || {}
    }
  },
  error => {
    return Promise.reject(error)
  }
)
export default axios

