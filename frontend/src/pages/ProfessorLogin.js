import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'
// import './medstyle.css'; // Uncomment if you have a CSS file to style the component
function ProfessorLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('http://localhost:8000/api/professor/login/', credentials);
      sessionStorage.setItem('username', response.data.username);
      sessionStorage.setItem('password', response.data.password);
      sessionStorage.setItem('is_professor', 'true');
      sessionStorage.setItem('is_student', 'false');
      sessionStorage.setItem('is_authenticated', 'true');
      toast.success('Login successful!');
      navigate('/professor/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Invalid login credentials');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Login as Professor</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input id = 'adc' name="username" type="text" placeholder="Username" onChange={handleChange} required />
        <input id='qwe' name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button id='a1' type="submit">Login</button>
      </form>
    </div>
  );
}

export default ProfessorLogin;
