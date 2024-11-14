import axios, { AxiosInstance, AxiosError } from 'axios';
import * as pkgJson from '../../package.json';
import { AuthSchemes } from "../../types";

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

    send =  async (payload: string, opts: { url: string, auth: AuthSchemes }): Promise<void> => {
        const instance = this;
        await instance.httpClient({
            url: opts.url,
            method: 'POST',
            headers: { 
                ...this.defaultHeaders, 
                ...opts.auth.type === 'ApiKey' ? { [opts.auth.key]: opts.auth.value } : {},
                ...opts.auth.type === 'BearerToken' ? { 'Authorization': opts.auth.value } : {},
            },
            data: payload,
            withCredentials: true
        }).then((response: any) => {
            // handling error with 200 statusCode (graphQL)
            if (response.data.errors) {
                const { message, extensions } = response.data.errors[0];
                delete extensions.stacktrace
                console.log(message)
                return;
            }
        }).catch((error: any) => {
            if (error.code === 'ECONNREFUSED') {
                console.error(`[RED-VAULT] Error: Can not connect to ${error.config.url}`);
                return;
            }
            if (error instanceof AxiosError) {
                throw error;
            } else {
                throw new Error(error)
            }
        })
    };
}