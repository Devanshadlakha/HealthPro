import axios, { AxiosInstance } from "axios";

const baseURL = process.env.backendUrl;

// Auth is carried by the httpOnly `hp_token` cookie. `withCredentials: true`
// makes the browser attach it to every request and accept Set-Cookie responses.
// The legacy `(token)` signature on the per-prefix helpers is kept for backward
// compatibility — the value is ignored, since the cookie is the source of truth.
axios.defaults.withCredentials = true;

const instanceCache = new Map<string, AxiosInstance>();

function instanceFor(prefix: string): AxiosInstance {
  let inst = instanceCache.get(prefix);
  if (inst) return inst;
  inst = axios.create({
    baseURL: baseURL + prefix,
    withCredentials: true,
  });
  instanceCache.set(prefix, inst);
  return inst;
}

const axiosFetch = axios.create({ baseURL, withCredentials: true });
const axiosFetchPublic = axios.create({ baseURL, withCredentials: true });

// eslint-disable-next-line no-unused-vars
const axiosFetchType = (_token?: string) => instanceFor("");
// eslint-disable-next-line no-unused-vars
const axiosFetchDoctor = (_token?: string) => instanceFor("/doctor-appointment");
// eslint-disable-next-line no-unused-vars
const axiosFetchPatient = (_token?: string) => instanceFor("/patient-appointment");

export { axiosFetch, axiosFetchPatient, axiosFetchDoctor, axiosFetchType, axiosFetchPublic };
