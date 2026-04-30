import axios, { AxiosInstance } from "axios";

const baseURL = process.env.backendUrl;

// Reuse axios instances across calls — `axios.create` was being called once per
// fetch, churning interceptors and memory unnecessarily. The cache is keyed by
// `${variant}:${token}` so a new login just creates a fresh instance once.
const instanceCache = new Map<string, AxiosInstance>();

function withAuth(prefix: string, token: string): AxiosInstance {
  const key = `${prefix}|${token}`;
  let inst = instanceCache.get(key);
  if (inst) return inst;
  inst = axios.create({
    baseURL: baseURL + prefix,
    headers: { Authorization: token },
  });
  instanceCache.set(key, inst);
  return inst;
}

const axiosFetch = axios.create({ baseURL });
const axiosFetchPublic = axios.create({ baseURL });

const axiosFetchType = (token: string) => withAuth("", token);
const axiosFetchDoctor = (token: string) => withAuth("/doctor-appointment", token);
const axiosFetchPatient = (token: string) => withAuth("/patient-appointment", token);

export { axiosFetch, axiosFetchPatient, axiosFetchDoctor, axiosFetchType, axiosFetchPublic };
