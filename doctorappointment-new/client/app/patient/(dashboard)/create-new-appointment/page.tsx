"use client"
import React, { useState } from 'react';
import { Calendar, Clock, Send } from 'lucide-react';
import { axiosFetchPatient } from '@/lib/axiosConfig';

export default function CreateAppointmentForm() {
  const [problem, setProblem] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
    const token:any=localStorage.getItem("token");
    const patientname=localStorage.getItem('patientname');
     axiosFetchPatient(token).post("/create-appointment",{
        problem,
        time,
        patientname
     }).then((res)=>{
        setSuccess(true);
        setProblem("");
        setTime("");
     })
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div className="md:flex">
        <div className="p-8 w-full">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1">New Appointment</div>
          <h2 className="block mt-1 text-lg leading-tight font-medium text-black">Schedule Your Visit</h2>
          
          {success && (
            <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
              <p>Appointment created successfully!</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-4">
              <label htmlFor="problem" className="block text-gray-700 text-sm font-bold mb-2">
                Problem Description
              </label>
              <textarea
                id="problem"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={4}
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-2">
                Preferred Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="time"
                  type="datetime-local"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                disabled={loading}
              >
                {loading ? 'Creating...' : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}