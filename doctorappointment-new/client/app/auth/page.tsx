'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { axiosFetch, axiosFetchPublic } from "@/lib/axiosConfig";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import PasswordField from "@/components/PasswordField";
import { isPasswordValid } from "@/lib/passwordPolicy";
export default function Home() {
  const [formType, setFormType] = useState<"patient" | "doctor">("patient")
  const [action, setAction] = useState<"login" | "signup">("login")


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setFormType('patient')}
            className={`px-4 py-2 rounded-l-lg ${formType === 'patient' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Patient
          </button>
          <button
            onClick={() => setFormType('doctor')}
            className={`px-4 py-2 rounded-r-lg ${formType === 'doctor' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Doctor
          </button>
        </div>
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setAction("login")}
            className={`px-4 py-2 rounded-l-lg ${action === 'login' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Login
          </button>
          <button
            onClick={() => setAction("signup")}
            className={`px-4 py-2 rounded-r-lg ${action === 'signup' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Sign Up
          </button>
        </div>
        <div className="flex items-center justify-center m-2"><Link href={`/auth/reset-password?type=${formType}`}>Forgot Password ??</Link></div>
        <div className="h-[18rem] overflow-y-auto kit-web pr-4">
        {formType === "patient" && action === "login" && <PatientLogin />}
          {formType === "patient" && action === "signup" && <PatientSignup />}
          {formType === "doctor" && action === "login" && <DoctorSignin />}
          {formType === "doctor" && action === "signup" && <DoctorSignup />}
        </div>
      </div>
    </div>
  );
}

const PatientLogin = () => {
  const[patientname,setpatientname]=useState("");
 
  const [formData, setFormData] = useState({ email: '', password: '' });
  const router=useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosFetch.post("/patient-auth/login", formData);
      if (res.status === 200) {
        setpatientname(res.data.name);
        localStorage.setItem('patientname', res.data.name);
        localStorage.setItem("role", "patient");
        toast.success('Logged in successfully');
        router.push("/patient/hospitals");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block mb-1 font-medium">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-3 py-2 border rounded-md"
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="password" className="block mb-1 font-medium">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="w-full px-3 py-2 border rounded-md"
          onChange={handleChange}
        />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Login</button>
    </form>
  );
};

const PatientSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    dob: '',
    gender: '',
    age: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(formData.password)) {
      toast.error("Password does not meet the requirements");
      return;
    }
    if (formData.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try{
      const res=await axiosFetch.post("/patient-auth/signup",formData);
      if(res.status>=200 && res.status<300){
        toast.success('Patient Signed up Sucessfully')
      }
    }catch(err: any){
      const msg = err?.response?.data?.message || err?.message || "Sign up failed";
      toast.error(msg);
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-1 font-medium">Name:</label>
        <input type="text" id="name" name="name" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="email" className="block mb-1 font-medium">Email:</label>
        <input type="email" id="email" name="email" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <PasswordField
        value={formData.password}
        onChange={(v) => setFormData({ ...formData, password: v })}
      />
      <div>
        <label htmlFor="confirmPassword" className="block mb-1 font-medium">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          className="w-full px-3 py-2 border rounded-md"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword.length > 0 && confirmPassword !== formData.password && (
          <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
        )}
      </div>
      <div>
        <label htmlFor="mobile" className="block mb-1 font-medium">Mobile:</label>
        <input type="tel" id="mobile" name="mobile" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="dob" className="block mb-1 font-medium">DOB:</label>
        <input type="date" id="dob" name="dob" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="gender" className="block mb-1 font-medium">Gender:</label>
        <select id="gender" name="gender" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="age" className="block mb-1 font-medium">Age:</label>
        <input type="number" id="age" name="age" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600">Signup</button>
    </form>
  );
};

const DoctorSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    specialization: '',
    gender: '',
    experience: '',
    fees: '',
    hospitalId: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    // /hospitals is paginated; ask for a large page so the dropdown shows them all.
    axiosFetchPublic.get('/hospitals?size=50')
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) setHospitals(data);
        else if (Array.isArray(data?.content)) setHospitals(data.content);
        else setHospitals([]);
      })
      .catch((err) => console.error("Error fetching hospitals:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalId) {
      toast.error("Please select a hospital");
      return;
    }
    if (!isPasswordValid(formData.password)) {
      toast.error("Password does not meet the requirements");
      return;
    }
    if (formData.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const response:any = await axiosFetch.post('/doctor-auth/signup', formData);
      if (response.data.success) {
        toast.success("Doctor Signed up Successfully! You can now login.");
      } else {
        toast.error(response.data.message || "Signup failed");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "An error occurred during signup.";
      toast.error(msg);
      console.error("Error during signup:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="hospitalId" className="block mb-1 font-medium">Hospital:</label>
        <select id="hospitalId" name="hospitalId" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} value={formData.hospitalId}>
          <option value="">Select Hospital</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="block mb-1 font-medium">Name:</label>
        <input type="text" id="name" name="name" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="email" className="block mb-1 font-medium">Email:</label>
        <input type="email" id="email" name="email" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <PasswordField
        value={formData.password}
        onChange={(v) => setFormData({ ...formData, password: v })}
      />
      <div>
        <label htmlFor="confirmPassword" className="block mb-1 font-medium">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          className="w-full px-3 py-2 border rounded-md"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword.length > 0 && confirmPassword !== formData.password && (
          <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
        )}
      </div>
      <div>
        <label htmlFor="mobile" className="block mb-1 font-medium">Mobile:</label>
        <input type="tel" id="mobile" name="mobile" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="specialization" className="block mb-1 font-medium">Specialization:</label>
        <input type="text" id="specialization" name="specialization" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="gender" className="block mb-1 font-medium">Gender:</label>
        <select id="gender" name="gender" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="experience" className="block mb-1 font-medium">Experience (years):</label>
        <input type="number" id="experience" name="experience" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="fees" className="block mb-1 font-medium">Consultation Fees (₹):</label>
        <input type="number" id="fees" name="fees" min="0" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
      </div>
      <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600">Signup</button>
    </form>
  );
};

const DoctorSignin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate=useRouter();
  const [doctorname,setdocotorname]=useState(" ");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response:any = await axiosFetch.post('/doctor-auth/login', formData);

      if (response.data.success) {
        setdocotorname(response.data.name);
        localStorage.setItem("doctorname", response.data.name);
        localStorage.setItem("role", "doctor");
        toast.success("Doctor Signed in Successfully");
        navigate.push("/doctor/profile");
      } else {
        toast.error("Invalid Credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("An error occurred during login.");
    }
  
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block mb-1 font-medium">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-3 py-2 border rounded-md"
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="password" className="block mb-1 font-medium">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="w-full px-3 py-2 border rounded-md"
          onChange={handleChange}
        />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Login</button>
    </form>
  );
};
