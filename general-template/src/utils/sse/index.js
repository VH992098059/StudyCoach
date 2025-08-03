import axios from 'axios'

// 根据环境变量设置 API 基础 URL
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api' // 生产环境使用相对路径，适用于前后端部署在同一域名下
  : 'http://localhost:8123/api'
//: 'http://bear-ai1.natapp1.cc/api' // 开发环境指向本地后端服务

// 创建axios实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000
})

// 封装SSE连接 - 支持FormData
export const connectSSEWithFormData = (url, formData) => {
  // 构建基础URL
  const fullUrl = `${API_BASE_URL}${url}`

  let abortController = null
  let messageCallback = null
  let errorCallback = null

  // 创建EventSource，但需要先通过POST请求获取SSE流
  // 由于EventSource只支持GET请求，我们需要使用fetch来支持FormData
  const fetchSSE = async () => {
    try {
      abortController = new AbortController()

      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
        headers: {
          // 不设置Content-Type，让浏览器自动设置multipart/form-data
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      const processStream = async () => {
        try {
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              if (messageCallback) messageCallback('[DONE]')
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // 按行分割，但保留不完整的行
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // 保留最后一个可能不完整的行

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6) // 移除 'data: ' 前缀
                if (data === '[DONE]') {
                  if (messageCallback) messageCallback('[DONE]')
                } else if (data.trim()) {
                  if (messageCallback) messageCallback(data.trim())
                }
              } else if (line.trim() && !line.startsWith(':')) {
                // 处理没有 'data: ' 前缀的行（某些SSE实现可能直接发送数据）
                if (line.trim() === '[DONE]') {
                  if (messageCallback) messageCallback('[DONE]')
                } else if (line.trim()) {
                  if (messageCallback) messageCallback(line.trim())
                }
              }
            }
          }
        } catch (error) {
          if (errorCallback) errorCallback(error)
        }
      }

      processStream()
    } catch (error) {
      if (errorCallback) errorCallback(error)
    }
  }

  // 启动SSE流处理
  fetchSSE()

  // 返回一个模拟的EventSource对象，提供close方法和事件监听器
  const sseObject = {
    onmessage: null,
    onerror: null,
    close: () => {
      if (abortController) {
        abortController.abort()
      }
    }
  }

  // 重写 onmessage 和 onerror 的 setter，以便动态更新回调
  Object.defineProperty(sseObject, 'onmessage', {
    get: () => messageCallback,
    set: (callback) => {
      messageCallback = callback
    }
  })

  Object.defineProperty(sseObject, 'onerror', {
    get: () => errorCallback,
    set: (callback) => {
      errorCallback = callback
    }
  })

  return sseObject
}

// 封装SSE连接 - 原有版本（用于向后兼容）
export const connectSSE = (url, params, onMessage, onError) => {
  // 构建带参数的URL
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  const fullUrl = `${API_BASE_URL}${url}?${queryString}`

  // 创建EventSource
  const eventSource = new EventSource(fullUrl)

  eventSource.onmessage = event => {
    let data = event.data

    // 检查是否是特殊标记
    if (data === '[DONE]') {
      if (onMessage) onMessage('[DONE]')
    } else {
      // 处理普通消息
      if (onMessage) onMessage(data)
    }
  }

  eventSource.onerror = error => {
    if (onError) onError(error)
    eventSource.close()
  }

  // 返回eventSource实例，以便后续可以关闭连接
  return eventSource
}

// AI面试助手聊天 - 支持FormData
export const chatWithLoveApp = (formData, chatId) => {
  // 如果传入的是FormData，使用新的SSE方法
  if (formData instanceof FormData) {
    return connectSSEWithFormData('/ai/interview_app/chat/sse', formData)
  }

  // 向后兼容：如果传入的是字符串消息，使用原有方法
  return connectSSE('/ai/interview_app/chat/sse', { message: formData, chatId })
}

// AI超级智能体聊天
export const chatWithManus = (message) => {
  return connectSSE('/ai/manus/chat', { message })
}

export default {
  chatWithLoveApp,
  chatWithManus
}