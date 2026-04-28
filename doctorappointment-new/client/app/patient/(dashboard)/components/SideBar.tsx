"use client";
import { useRouter } from "next/navigation";
import { HomeIcon, CalendarIcon, PlusCircleIcon, UserCircleIcon } from "@heroicons/react/solid";


const SideBar = () => {
  const router = useRouter();
  return (
    <div className="fixed left-0 top-0 min-h-screen w-20 bg-gradient-to-b from-blue-600 to-blue-400 flex flex-col items-center py-6 shadow-lg">
      <div className="flex flex-col space-y-8 mt-10">
        <button
          className="group flex flex-col items-center space-y-1"
          onClick={() => {
            router.push("/patient/on-going-appointment");
          }}
        >
          <CalendarIcon className="h-8 w-8 text-white group-hover:text-yellow-300 transition duration-300" />
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">On Going</span>
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">Appointments</span>
        </button>
        <button
          className="group flex flex-col items-center space-y-1"
          onClick={() => {
            router.push("/patient/create-new-appointment");
          }}
        >
          <PlusCircleIcon className="h-8 w-8 text-white group-hover:text-yellow-300 transition duration-300" />
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">Create New</span>
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">Appointment</span>
        </button>
        <button className="group flex flex-col items-center space-y-1" onClick={()=>{
          router.push("/patient/past-appointment")
        }}>
          <HomeIcon className="h-8 w-8 text-white group-hover:text-yellow-300 transition duration-300" />
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">Past</span>
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">Appointments</span>
        </button>
        <button
          className="group flex flex-col items-center space-y-1"
          onClick={() => {
            router.push("/patient/profile");
          }}
        >
          <UserCircleIcon className="h-8 w-8 text-white group-hover:text-yellow-300 transition duration-300" />
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">Your</span>
          <span className="text-white text-xs group-hover:text-yellow-300 transition duration-300">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default SideBar;
