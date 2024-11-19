import axios, { AxiosInstance } from 'axios'
import { AuthSchemes, EventPayload } from '../../types'
import { RexSyncError } from '../libs/errHandler'

export default class HttpClient {
  private defaultHeaders: object
  private httpClient: AxiosInstance

  constructor() {
    this.defaultHeaders = {
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': `redis-vault/1.0.0`,
    }
    this.httpClient = axios.create({
      timeout: 8000,
    })
  }

  send = async (payload: EventPayload, opts: { url: string; auth: AuthSchemes }): Promise<void> => {
    const instance = this
    await instance
      .httpClient({
        url: opts.url,
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...(opts.auth.type === 'apikey' ? { [opts.auth.name]: opts.auth.value } : {}),
          ...(opts.auth.type === 'bearerToken' ? { Authorization: `Bearer ${opts.auth.token}` } : {}),
          ...(opts.auth.type === 'basic'
            ? {
                Authorization: `Basic ${Buffer.from(`${opts.auth.username}:${opts.auth.password}`, 'base64')}`,
              }
            : {}),
        },
        data: payload,
        withCredentials: true,
      })
      .catch((error: any) => {
        throw new RexSyncError(error.message)
      })
  }
}
