import React, { useState , useEffect} from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';



function StudentRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectToDashboard = location.state?.redirectToDashboard;
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    roll_number: '',
    batch: '',
    branch: '',
    year: '',
  });  
  
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api.get('/student/branches/')
      .then(res => setBranches(res.data))
      .catch(err => console.error('Failed to load branches', err));

    api.get('/student/batches/')
      .then(res => setBatches(res.data))
      .catch(err => console.error('Failed to load batches', err));
  }, []);


  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('http://localhost:8000/api/student/register/', formData);
      toast.success('Registration successful!');
      navigate('/student/login');
    } catch (error) {
      console.error(error);
      toast.error('Error registering student.');
    }
    if (redirectToDashboard) 
      {
        toast.info('Redirecting back to your dashboard');
        navigate('/professor/dashboard');
      };

  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Register as Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input id = 'adc' name="first_name" type="text" placeholder="First Name" onChange={handleChange} required />
        <input id = 'qwe' name="last_name" type="text" placeholder="Last Name" onChange={handleChange} required />
        <input id = 'qwe' name="roll_number" type="text" placeholder="Roll Number" onChange={handleChange} required />
        <select id = 'qwe' name="branch" value={formData.branch} onChange={handleChange} required>
          <option value="">Select Branch</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.name}>{branch.name}</option>
          ))}
        </select>

        <select id='qwe' name="batch" value={formData.batch} onChange={handleChange} required>
          <option value="">Select Batch</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.name}>{batch.name}</option>
          ))}
        </select>
        <input id = 'a5' name="year" type="number" placeholder="Year (1-4)" onChange={handleChange} required />
        <input id = 'a1' name="username" type="text" placeholder="Username" onChange={handleChange} required />
        <input id = 'a2' name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input id = 'a3' name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button id = 'a9'  type="submit">Register</button>
      </form>
    </div>
  );
}

export default StudentRegister;
