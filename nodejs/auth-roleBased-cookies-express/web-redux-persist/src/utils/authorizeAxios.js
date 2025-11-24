import axios from 'axios'
import { toast } from 'react-toastify'
import { logoutUserAPI } from '~/redux/user/userSlice'
import { interceptorLoadingElements } from '~/utils/formatters'
import { refreshTokenAPI } from '~/apis'

// with normal file js can not import store directly
// solution : inject store's dispatch function into this file
// in main.jsx call injectStore
let axiosReduxStore
export const injectStore = (store) => {
  axiosReduxStore = store
}

// custom general axios for project
let authorizedAxiosInstance = axios.create()

// limit timeout for each request: 10 min
authorizedAxiosInstance.defaults.timeout = 10 * 60 * 1000

// withCredentials: allow axios to send cookies for each request to backend (jwt token)
//  and httpOnly cookies of browser
authorizedAxiosInstance.defaults.withCredentials = true

// Add a request interceptor
authorizedAxiosInstance.interceptors.request.use(
  (config) => {
    /* use local storage token if project need that
    // const token = localStorage.getItem('accessToken')
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`
    // }
    */

    // Technique: block spam clicks or actions during loading state
    interceptorLoadingElements(true)

    return config
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error)
  },
  { synchronous: true, runWhen: () => true }
)

let refreshTokenPromise = null

// Add a response interceptor
authorizedAxiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data

    // Technique: remove loading effect after response received
    interceptorLoadingElements(false)
    return response
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error

    interceptorLoadingElements(false)

    // refresh token logic to avoid multiple refresh token requests
    // case 1:  401 from server, log out
    if (error.response?.status === 401) {
      axiosReduxStore.dispatch(logoutUserAPI(false))
    }

    // case 2:  410 from server, token expired, need to refresh token
    const originalRequest = error.config
    if (error.response?.status === 410 && !originalRequest._retry) {
      originalRequest._retry = true
      if (!refreshTokenPromise) {
        refreshTokenPromise = refreshTokenAPI()
          .then((data) => {
            // acess token inside httpOnly cookie
            return data?.accessToken
          })
          .catch(() => {
            // if any error during refresh token, log out user
            axiosReduxStore.dispatch(logoutUserAPI(false))
            return Promise.reject(error)
          })
          .finally(() => {
            // api ok or error, clear the promise for next time use
            refreshTokenPromise = null
          })
      }

      // eslint-disable-next-line no-unused-vars
      return refreshTokenPromise.then((accessToken) => {
        // step 1
        // if project need to store access token in local storage
        // code here to store the new access token
        // ex: axios.defaults.headers.common['Authorization']= `Bearer ${accessToken}`
        // we are using httpOnly cookie, so no need to store it in local storage

        //step 2: return axios instance with the original request for retry
        return authorizedAxiosInstance(originalRequest)
      })
    }

    // Global error handling for all over the app
    let errorMessage = error?.message

    // check if error response from server has message, then use that message
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    if (error.response?.status !== 410) {
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

export default authorizedAxiosInstance
