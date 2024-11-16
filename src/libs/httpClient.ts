import axios, { AxiosInstance } from 'axios';
import * as pkgJson from '../../package.json';
import { AuthSchemes, EventPayload } from "../../types";
import { RexSyncError } from './errHandler';

export default class HttpClient {
    private defaultHeaders: object
    private httpClient: AxiosInstance

    constructor() {
        this.defaultHeaders = {
            'content-type': 'application/json',
            'accept': 'application/json',
            'user-agent': `redis-vault/${pkgJson.version}`,
        }
        this.httpClient = axios.create({
            timeout: 8000
        })
    }

    send =  async (payload: EventPayload, opts: { url: string, auth: AuthSchemes }): Promise<void> => {
        const instance = this;
        await instance.httpClient({
            url: opts.url,
            method: 'POST',
            headers: { 
                ...this.defaultHeaders, 
                ...opts.auth.type === 'apikey' ? { [opts.auth.key]: opts.auth.value } : {},
                ...opts.auth.type === 'bearerToken' ? { 'Authorization': `Bearer ${opts.auth.value}` } : {},
                ...opts.auth.type === 'basic' ? { 'Authorization': `Basic ${btoa(`${opts.auth.key}:${opts.auth.value}`)}`} : {}
            },
            data: payload,
            withCredentials: true
        }).catch((error: any) => {
            throw new RexSyncError(error.message)
        })
    };
}