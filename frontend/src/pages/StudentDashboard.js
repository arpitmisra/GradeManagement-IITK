import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('is_authenticated');
    if (!isAuthenticated || isAuthenticated === 'false') {
      toast.error('You are not logged in.');
      navigate('/student/login');
      return;
    }
    api.get('/student/dashboard/')
      .then(res => {
        setStudent(res.data.student);
        setGrades(res.data.grades);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to fetch student data');
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('logout/', {});
      localStorage.clear();
      sessionStorage.clear();
      navigate('/student/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {student.name}</h1>
      <p className="mb-2">Roll Number: {student.roll_number}</p>
      <p className="mb-2">Branch: {student.branch}</p>
      <p className="mb-4">Batch: {student.batch}</p>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded mb-6"
      >
        Logout
      </button>
      <h2 className="text-xl font-semibold mb-2">Your Grades</h2>
      {grades.length === 0 ? (
        <p>No grades found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-300 mb-6">
            <thead>
              <tr>
                <th className="border px-4 py-2">Course</th>
                <th className="border px-4 py-2">Component</th>
                <th className="border px-4 py-2">Score</th>
                <th className="border px-4 py-2">Max Score</th>
                <th className="border px-4 py-2">Weightage</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2">{g.course}</td>
                  <td className="border px-4 py-2">{g.component}</td>
                  <td className="border px-4 py-2">{g.score}</td>
                  <td className="border px-4 py-2">{g.max_score}</td>
                  <td className="border px-4 py-2">{g.weightage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
