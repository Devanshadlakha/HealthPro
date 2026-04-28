"use client";

import { useEffect, useState } from "react";

const Logout = () => {
    const [change,setChange]=useState(false);
  const handleLogout = () => {
   
    localStorage.removeItem('token');
    window.location.href="/"
  };

  return (
    <div className="fixed top-0 right-0 p-4">
      <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md">
        Log out
      </button>
    </div>
  );
};

export default Logout;
