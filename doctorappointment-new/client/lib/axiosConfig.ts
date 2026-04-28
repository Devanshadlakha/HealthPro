import axios from "axios";
const axiosFetch = axios.create({
  baseURL: process.env.backendUrl,
  // baseURL: "http://localhost:8080/user",
  // baseURL: "http://localhost:8080",
});

const axiosFetchType = (token: string) =>
  axios.create({
    baseURL: process.env.backendUrl ,
    headers: {
      Authorization: `${token}`,
    },
  });
  const axiosFetchDoctor = (token: string) =>
    axios.create({
      baseURL: process.env.backendUrl + "/doctor-appointment",
      headers: {
        Authorization: `${token}`,
      },
    });
    const axiosFetchPatient = (token: string) =>
        axios.create({
          baseURL: process.env.backendUrl + "/patient-appointment",
          headers: {
            Authorization: `${token}`,
          },
        });
const axiosFetchPublic = axios.create({
  baseURL: process.env.backendUrl,
});

export { axiosFetch, axiosFetchPatient, axiosFetchDoctor, axiosFetchType, axiosFetchPublic };