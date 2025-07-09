import React, {useEffect, useState } from 'react';
import { useNavigate } from 
'react-router-dom';
import { toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';



function ManualMarksEntry({ courseId, batchId, componentId }) {
  const [students, setStudents] = useState([]);
  const [newMarks, setNewMarks] = useState({});
  const [showTable, setShowTable] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const navigate = useNavigate();

  const fetchMissingMarks = async () => {
    try {
      const response = await api.get(`/professor/manual-entry/missing/${courseId}/${batchId}/${componentId}/`);
      setStudents(response.data);
      console.log(students)
      setShowTable(true);
    } catch (error) {
      console.error('Failed to fetch missing marks:', error);
      toast.error('Failed to fetch missing marks!');
    }
  };

  useEffect(() => {
    const toastId = toast.info('Loading...');
    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  const handleScoreChange = (studentId, score) => {
    setNewMarks({ ...newMarks, [studentId]: score });
  };

  const handleSubmit = async (studentId) => {
    try {
      const score = newMarks[studentId];
      await api.post('/professor/manual-entry/', {
        student_id: studentId,
        component_id: componentId,
        score: score,
      });
    toast.success('Score updated successfully');
      fetchMissingMarks();
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  const handleStudentRegister = async () => {
    toast.info("Redirecting to Student Registration Page...")
    navigate('/student/register', { state: { redirectToDashboard: true } });
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('course_id', courseId);
    formData.append('batch_id', batchId);

    try {
      await api.post('/professor/bulk_upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Students registered successfully');
      fetchMissingMarks();
    } catch (error) {
      console.error('CSV Upload Failed', error);
      toast.error('CSV Upload Failed');
    }
  };

  return (
    <div className="p-4">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded float-right"
        onClick={fetchMissingMarks}
      >
        Manually Update Marks
      </button>

      {showTable && (
        <div className="mt-8">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border px-4 py-2">Roll No</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Score</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="border px-4 py-2">{student.roll_number}</td>
                  <td className="border px-4 py-2">{student.name}</td>
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      value={newMarks[student.id] || ''}
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      className="border px-2 py-1 w-20"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      className="bg-green-600 text-white px-2 py-1 rounded"
                      onClick={() => handleSubmit(student.id)}
                    >
                      Submit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <button
          className="bg-purple-700 text-white px-4 py-2 rounded mr-2"
          onClick={handleStudentRegister}
        >
          Register Student Manually
        </button>

        <input
          type="file" 
          accept=".csv,.xlsx"
          onChange={(e) => {
            const file = e.target.files[0];
            setCsvFile(file);

            if (file?.type === 'text/csv') {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const text = e.target.result;
                  console.log("File Content: ",text)
                  const parsedData = Papa.parse(text, { header: true }).data; // Parse CSV
                  console.log("Parsed Data:", parsedData); 
                  setCsvPreview(parsedData.slice(0, 5)); // Show first 5 rows
                };
                reader.readAsText(file);
              } else if (file?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const data = new Uint8Array(e.target.result);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const sheetName = workbook.SheetNames[0];
                  const sheet = workbook.Sheets[sheetName];
                  const parsedData = XLSX.utils.sheet_to_json(sheet); // Parse Excel
                  setCsvPreview(parsedData.slice(0, 5)); // Show first 5 rows
                };
                reader.readAsArrayBuffer(file);
              }}}
          className="mb-2"
        />
        {csvPreview.length > 0 && (
  <div className="mt-4">
    <strong className="font-semibold mb-2">CSV Preview (First 5 Rows):</strong>
    <div className="overflow-auto max-w-full border rounded shadow">
      <table className="min-w-full text-sm border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {Object.keys(csvPreview[0]).map((header, index) => (
              <th key={index} className="border px-2 py-1">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {csvPreview.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((val, colIndex) => (
                <td key={colIndex} className="border px-2 py-1">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
        <button
          className="bg-purple-300 text-grey px-4 py-2 rounded"
          onClick={handleCsvUpload}
        >
          Upload Students CSV
        </button>
        
      </div>
    </div>
  );
}

export default ManualMarksEntry;
