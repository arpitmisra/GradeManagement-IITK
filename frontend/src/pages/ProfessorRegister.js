import React, { useState } from 'react';
import iitkLogo from '../iitk_logo.jpg';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify'

function ProfessorRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    department: '',
    first_name: '',
    last_name: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('http://localhost:8000/api/professor/register/', formData);
      toast.success('Professor registered successfully!');
      toast.info('Redirecting to professor login...')
      navigate('/professor/login');
    } catch (error) {
      console.error(error);
      toast.error('Error registering professor.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Register as Professor</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input id = 'adc' name="username" type="text" placeholder="Username" onChange={handleChange} required />
        <input id = 'qwe' name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input id = 'a1' name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <input id = 'a2' name="department" type="text" placeholder="Department" onChange={handleChange} />
        <input id = 'a3' name="first_name" type="text" placeholder="First Name" onChange={handleChange} required />
        <input id = 'a4' name="last_name" type="text" placeholder="Last Name" onChange={handleChange} required />
        {/* <input id = 'a5' name="license_number" type="text" placeholder="License Number" onChange={handleChange} required />
        <input id = 'a6' name="clinic_name" type="text" placeholder="Clinic Name" onChange={handleChange} />
        <input id = 'a7' name="available_appointment_times" type="text" placeholder="Available Appointment Times" onChange={handleChange} />
        <input id = 'a8' name="clinic_address" type="text" placeholder="Address" onChange={handleChange} /> */}
        <button id = 'a9' type="submit">Register</button>
      </form>
    </div>
  );
}

export default ProfessorRegister;
