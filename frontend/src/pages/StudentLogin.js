import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'

function StudentLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('http://localhost:8000/api/student/login/', credentials);
      // localStorage.setItem('token', response.data.token);
      sessionStorage.setItem('username', response.data.username);
      sessionStorage.setItem('password', response.data.password);
      sessionStorage.setItem('is_student', true);
      sessionStorage.setItem('is_professor', false);
      sessionStorage.setItem('is_authenticated', true);
      console.log('Login successful:', response.data);
      toast.success('Login successful!');
      navigate('/student/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Invalid login credentials');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Login as Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input id = 'adc' name="username" type="text" placeholder="Username" onChange={handleChange} required />
        <input id = 'qwe' name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button id = 'a1' type="submit">Login</button>
      </form>
    </div>
  );
}

export default StudentLogin;
