import React, { useEffect, useState } from 'react';
import iitkLogo from '../iitk_logo.jpg';
import api from '../api';
import { useNavigate, Navigate } from 
'react-router-dom';
import { toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
// Removed pdfjs-dist: only CSV/XLSX supported for roll order
import './medstyle.css'
import ManualMarksEntry from './ManualMarksEntry';

const ProfessorDashboard = () => {
  const [newCourse, setNewCourse] = useState({ name: '', batch_name: '' });
  const [availableBatches, setAvailableBatches] = useState([]);
  const [data, setData] = useState([]);
  const [professor, setProfessor] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [componentCsv, setComponentCsv] = useState({});
  const [componentForm, setComponentForm] = useState({ name: '', weightage: '', max_score: '' });
  const [bestOf, setBestOf] = useState('');
  const [evaluationGroup, setEvaluationGroup] = useState('');
  const [evaluationStructure, setEvaluationStructure] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  const [componentPreviews, setComponentPreviews] = useState({});
  const [gradesTable, setGradesTable] = useState([]);
  const [gradeColumns, setGradeColumns] = useState([]);
  const [filters, setFilters] = useState({
    roll_number: '',
    name: '',
    component: '',
    minScore: '',
    maxScore: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ courseId: null, professorID: null, batchID: null });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // const [showManualEntry, setShowManualEntry] = useState(false);
  // const [missingStudents, setMissingStudents] = useState([]);
  // const [manualMarks, setManualMarks] = useState({});
  // const [missingMarks, setMissingMarks] = useState({});

  // CSV Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFields, setDownloadFields] = useState([]); // checklist
  const [rollOrder, setRollOrder] = useState([]); // extracted from CSV/XLSX
  const [downloadError, setDownloadError] = useState('');

  // Helper: Extract roll numbers from CSV/XLSX
  const extractRollNumbersFromCsvXlsx = async (file) => {
    try {
      let rolls = [];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        // If header present, skip it
        if (lines[0].toLowerCase().includes('roll')) lines.shift();
        rolls = lines.map(l => l.split(',')[0].trim()).filter(Boolean);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // If header present, skip it
        let rows = jsonData;
        if (rows[0] && rows[0][0] && String(rows[0][0]).toLowerCase().includes('roll')) rows = rows.slice(1);
        rolls = rows.map(r => r[0]).filter(Boolean);
      } else {
        setDownloadError('Unsupported file type. Please upload a CSV or Excel file.');
        setRollOrder([]);
        return;
      }
      setRollOrder(rolls);
      setDownloadError(rolls.length ? '' : 'No roll numbers found.');
    } catch (err) {
      setDownloadError('Failed to parse file.');
      setRollOrder([]);
    }
  };

  // Helper: Download CSV
  const downloadCsv = (rows, filename) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handler: Open Download Modal
  const handleOpenDownloadModal = () => {
    if (!gradesTable.length) {
      toast.error('No grades to download.');
      refreshData();
      return;
    }
    // Default: all columns checked
    setDownloadFields(gradeColumns);
    setShowDownloadModal(true);
    setRollOrder([]);
    setDownloadError('');
  };

  // Handler: Download CSV (after modal submit)
  const handleDownloadCsv = async (e) => {
    e.preventDefault();
    let rows = [];
    // Only include selected fields
    let filtered = gradesTable.map(row => {
      let obj = {};
      downloadFields.forEach(f => { obj[f] = row[f]; });
      return obj;
    });
    // If rollOrder is set, reorder rows
    if (rollOrder.length > 0) {
      // Map roll_number to row
      const rowMap = {};
      filtered.forEach(r => { rowMap[r.roll_number] = r; });
      rows = rollOrder.map(rn => rowMap[rn]).filter(Boolean);
      // Add any missing (not in PDF) at the end
      const missing = filtered.filter(r => !rollOrder.includes(r.roll_number));
      rows = rows.concat(missing);
    } else {
      rows = filtered;
    }
    if (!rows.length) {
      setDownloadError('No data to download.');
      return;
    }
    downloadCsv(rows, 'student_marks.csv');
    setShowDownloadModal(false);
    toast.success('CSV downloaded!');
  };


  
  const isAuthenticated = sessionStorage.getItem('is_authenticated') ;
  // const is_professor = sessionStorage.getItem('is_professor') ;
  // const is_student = sessionStorage.getItem('is_student');

  useEffect(() => {
    api.get('professor/dashboard/')
      .then(response => {
        setData(response.data.dashboard_data);
        setProfessor(response.data.professor);
        console.log(response.data);
        if (!response.data.professor) {
            alert('Please log in as a professor to access this dashboard.');
        }
      })
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    api.get('/professor/batches/')
      .then(response => {
        console.log(response.data);
        setAvailableBatches(response.data);
        })
        .catch(error => console.error(error));
    }, []);


    useEffect(() => {
      if (selectedCourse) {
        api.get(`/professor/evaluation-structure/${selectedCourse}/`)
        .then(res => setEvaluationStructure(res.data))
        .catch(err => {
          console.error('Error fetching structure', err);
          setEvaluationStructure([]);
        });
      }
    }, [selectedCourse]);
    
    const handleAddCourse = (e) => {
      e.preventDefault();
      api.post('/professor/add_course/', {
        course_name: newCourse.name,
        batch_name: newCourse.batch_name,
      })
      .then(() => {
        toast.success('Course added successfully');
        setNewCourse({ name: '', batch_name: '' });
        refreshData();
      })
      .catch(() => toast.error('Error adding course'));
    };
    
    const handleComponentCsvUpload = (e, compId, course_id, batchID) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('csv_file', componentCsv[compId]);
      formData.append('course_id', course_id)
      formData.append('component_id', compId);
      formData.append('professor_id', professor.professor_id);
      formData.append('batch_id' , batchID)
      api.post('/professor/upload-component-csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(res => toast.success(res.data.message), refreshData())
      .catch(err => toast.error('Upload failed'));
    };
    
    
    
    const handleCsvUpload = (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('csv_file', csvFile);
      console.log(csvFile);
      formData.append('course_id', selectedCourse);
      formData.append('professor_id', professor.professor_id)
      
      console.log("CSV File: ", formData.get('csv_file'))
      console.log("Course ID: ", formData.get('course_id'))
      api.post('/professor/upload-csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(res => {
        refreshData();
        toast.success(res.data.message || 'CSV uploaded successfully');
      })
      .catch(err => {
        if (err.response?.data?.missing) {
          toast.error("Missing components:\n" + err.response.data.missing.join("\n"));
        } else {
          toast.error("CSV upload failed. " + (err.response?.data?.error || ""));
        }
      });
    };
    
    const refreshData = async () => {
      try {
        // Refresh dashboard data
        const res = await api.get('professor/dashboard/');
        setData(res.data.dashboard_data);
        setProfessor(res.data.professor);
    
        if (selectedCourse) {
          const structureRes = await api.get(`/professor/evaluation-structure/${selectedCourse}/`);
          setEvaluationStructure(structureRes.data);
    
          const batchName = res.data.dashboard_data.find(d => d.course_id === selectedCourse)?.batch;
          const batchId = availableBatches.find(b => b.name === batchName)?.id;
          await handleManageCourse(selectedCourse, res.data.professor.professor_id, batchId);
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };

  const handleComponentSubmit = (e) => {
    e.preventDefault();
    const payload = { ...componentForm, course_id: selectedCourse , professor_id: professor.professor_id};
    api.post('/professor/add-evaluation-component/', payload)
      .then(() => { toast.success('Component added'); refreshData(); })
      .catch(() => toast.error('Failed to add'));
  };

  const handleRuleSubmit = (e) => {
    e.preventDefault();
    api.post('/professor/set-evaluation-rule/', { course_id: selectedCourse,professor_name: professor?.name,group_name: evaluationGroup, best_of_count: bestOf })
      .then(() => toast.success('Rule set'), refreshData())
      .catch(() => toast.error('Failed to set rule'));
  };
   
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await api.post('logout/', {});
      localStorage.clear();
      sessionStorage.clear();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed:', error);
    }
  };

  const handleManageCourse = (courseId, profID, batchID) => {
    setSelectedCourse(courseId);
    api.get(`/professor/course-grades/${courseId}/${profID}/${batchID}`)
      .then(res => {
        setGradesTable(res.data.grades);
        setGradeColumns(["roll_number", "name", ...res.data.components]);
      })
      .catch(err => {
        console.error("Failed to fetch grades", err);
      });
  };
  

  // const handleManualEntryClick = (batchID, componentID) => async () => {
  //   if (!selectedCourse) return alert('Select a course first.');
  
  //   try {
  //     const res = await api.get(`/professor/missing-marks/${professor.professor_id}/${batchID}/${selectedCourse}/${componentID}`);
  //     // grades/missing/<int:prof_id>/<int:batch_id>/<int:course_id><int:component_id>/</int:component_id>
  //     setMissingMarks(res.data);
  //     setShowManualEntry(true);
  //   } catch (err) {
  //     alert('Failed to fetch students without marks.');
  //     console.error(err);
  //   }
  // };

  // const submitManualMark = async (studentId) => {
  //   const marks = manualMarks[studentId];
  //   if (!marks) return alert("Please enter marks first.");
  
  //   try {
  //     await api.post('/professor/manual-entry/', {
  //       student_id: studentId,
  //       course_id: selectedCourse,
  //       marks: marks,
  //       component: selectedComponent, // if required
  //     });
  //     alert("Marks submitted");
  //   } catch (err) {
  //     alert("Failed to submit marks.");
  //   }
  // };
  
  const handleDeleteCourse = (courseId, professorID, batchID) => {
    setDeleteTarget({ courseId, professorID, batchID });
    setShowDeleteModal(true);
  };

  const confirmDeleteCourse = async () => {
    setShowDeleteModal(false);
    const { courseId, professorID, batchID } = deleteTarget;
    try {
      await api.delete(`/professor/delete_course/${courseId}/`, {
        data: { professor_id: professorID, batch_id: batchID }
      });
      toast.success('Course deleted successfully');
      refreshData();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  if (!isAuthenticated || isAuthenticated === 'false' ) {
    handleLogout();
    alert('You are not logged in. Please log in to access the dashboard.');
    return <Navigate to="/" />;
  }

  return (
    <div className="p-6">
      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this course? This will delete all related grades and components.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={confirmDeleteCourse} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Confirm Logout</h2>
            <p className="mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={confirmLogout} className="px-4 py-2 bg-red-600 text-white rounded">Logout</button>
            </div>
          </div>
        </div>
      )}
      {/* <img src={iitkLogo} alt="IIT-K Logo" style={{ height: 50, marginRight: 16 }} /> */}
      <h1 className="text-xl font-bold mb-4">Welcome, Prof. {professor?.name}</h1>
      <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded mt-2 w-full transition duration-300 ease-in-out transform hover:bg-red-700 hover:text-gray-200 hover:scale-105"
          >
            Logout
          </button>
      <div className="grid gap-4">
        {/* Add New Course Form */}
<form
  onSubmit={handleAddCourse}
  className="border p-4 rounded mb-6"
>
  <h4 className="text-grey font-semibold mb-2">Add New Course</h4>
  <input
    type="text"
    placeholder="Course Name"
    className="block mb-2 p-2 border"
    value={newCourse.name}
    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
  />
  <select
    className="block mb-2 p-2 border"
    value={newCourse.batch_name}
    onChange={(e) => setNewCourse({ ...newCourse, batch_name: e.target.value })}
  >
    <option value="">Select Batch</option>
    {availableBatches.map((batch) => (
      <option key={batch.id} value={batch.name}>{batch.name}</option>
    ))}
  </select>
  <button type="submit" className="bg-blue-600 text-black px-4 py-2 rounded">
    Add Course
  </button>
</form>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

        {data.map((entry, index) => (
          <div key={index} className="border p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{entry.course}</h3>
            <p>Batch: {entry.batch}</p>
            <p>Average Score: {entry.average_score}</p>
            <div className="flex gap-2 mt-2">
            <button onClick={() => {setSelectedCourse(entry.course_id); handleManageCourse(entry.course_id,professor.professor_id, entry.batch);}} className="bg-blue-500 text-white px-4 py-2">Manage</button>
            <button onClick={() => handleDeleteCourse(entry.course_id, professor.professor_id, entry.batch)} className="bg-red-500 text-white px-4 py-2">Delete</button>
          </div>
          </div>
        ))} 
      </div>

      {/* Download CSV Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <h2 className="text-lg font-bold mb-4">Download Student Marks CSV</h2>
            <form onSubmit={handleDownloadCsv}>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Select Fields to Include:</h4>
                <div className="flex flex-wrap gap-2">
                  {gradeColumns.map((col, idx) => (
                    <label key={idx} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={downloadFields.includes(col)}
                        onChange={e => {
                          if (e.target.checked) setDownloadFields([...downloadFields, col]);
                          else setDownloadFields(downloadFields.filter(f => f !== col));
                        }}
                      />
                      {col}
                    </label>
                  ))}
                </div>
              </div>
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Custom Roll Number Order (Optional):</h4>
        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={async e => {
            const file = e.target.files[0];
            if (file) await extractRollNumbersFromCsvXlsx(file);
          }}
          className="mb-2"
        />
        {rollOrder.length > 0 && (
          <div className="mt-2 text-xs text-gray-700">
            <b>Order Preview:</b> {rollOrder.join(', ')}
          </div>
        )}
        <div className="text-xs text-gray-500">If you upload a CSV or Excel file with roll numbers, the CSV will follow that order. Otherwise, default order is used.</div>
      </div>
              {downloadError && <div className="text-red-600 mb-2">{downloadError}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowDownloadModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Download CSV</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCourse && (
        <div className="mt-6">
          <h4 className="mt-4 font-bold">Evaluation Structure</h4>
{evaluationStructure.length === 0 ? (
  <p>No evaluation structure found. Please add groups and components first.</p>
) : (
  <div className="space-y-4">
    {evaluationStructure.map((group, idx) => (
      <div key={idx} className="border p-3 rounded shadow-sm">
        <h4 className="font-semibold">{group.group} ({group.batch})</h4>
        <ul className="list-disc pl-5">
          {group.components.map(comp => (
          <li key={comp.id}>
                   <h2> {comp.name} (Max: {comp.max_score}, Weightage: {comp.weightage}) </h2>
                    <form onSubmit={(e) => handleComponentCsvUpload(e, comp.id, selectedCourse, group.batch)}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-4">

</div>

{gradesTable.length > 0 && (
  <div className="overflow-x-auto mt-6 ">
    <h3 className="text-lg font-bold mb-2">Student Grades</h3>
    
    <div className='filters-container'>
    {/* Download CSV Button */}
    <button
      className="bg-green-600 text-white px-4 py-2 rounded mb-4 hover:bg-green-700"
      onClick={handleOpenDownloadModal}
    >
      Download CSV
    </button>
    <input
      type="text"
      placeholder="Filter by Roll Number"
      className="p-2 border rounded"
      value={filters.roll_number}
      onChange={(e) => setFilters({ ...filters, roll_number: e.target.value })}
    />
    <input
      type="text"
      placeholder="Filter by Name"
      className="p-2 border rounded"
      value={filters.name}
      onChange={(e) => setFilters({ ...filters, name: e.target.value })}
    />
  <select
    className="p-2 border rounded"
    value={filters.component}
    onChange={(e) => setFilters({ ...filters, component: e.target.value })}
  >
    <option value="">Select Component</option>
    {gradeColumns
      .filter(col => !['roll_number', 'name'].includes(col))
      .map((comp, idx) => (
        <option key={idx} value={comp}>{comp}</option>
      ))}
  </select>
  <input
    type="number"
    placeholder="Min Score"
    className="p-2 border rounded"
    value={filters.minScore}
    onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
  />
  <input
    type="number"
    placeholder="Max Score"
    className="p-2 border rounded "
    value={filters.maxScore}
    onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
  />
  </div>
    <table className="min-w-full table-auto border border-gray-300">
      <thead>
        <tr>
          {gradeColumns.map((col, idx) => (
            <th key={idx} className="border px-4 py-2 bg-gray-100">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        
        {gradesTable

         .filter(row => {
          // text-based filters
          const matchesRoll = row.roll_number.toLowerCase().includes(filters.roll_number.toLowerCase());
          const matchesName = row.name.toLowerCase().includes(filters.name.toLowerCase());
      
          // numeric filter
          const selectedComp = filters.component;
          const compScore = selectedComp && row[selectedComp] !== '-' ? parseFloat(row[selectedComp]) : null;
          const scoreInRange =
            !selectedComp ||
            (
              (!filters.minScore || (compScore !== null && compScore >= parseFloat(filters.minScore))) &&
              (!filters.maxScore || (compScore !== null && compScore <= parseFloat(filters.maxScore)))
            );
      
          return matchesRoll && matchesName && scoreInRange;
        })

        .map((row, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-blue-50">
            {gradeColumns.map((col, colIndex) => (
              <td key={colIndex} className="border px-4 py-2">{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

<input
  type="file"
  accept=".csv, .xlsx"
  onChange={(e) => {
    const file = e.target.files[0];
    setComponentCsv({ ...componentCsv, [comp.id]: file });

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;

      let rows = [];
      if (file.name.endsWith('.csv')) {
        const lines = text.split(/\r?\n/);
        rows = lines.slice(0, 6).map((line) => line.split(','));
      } else {
        rows = [["Preview not available for Excel in browser."]];
      }

      setComponentPreviews(prev => ({
        ...prev,
        [comp.id]: rows
      }));
    };

    if (file && file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      setComponentPreviews(prev => ({
        ...prev,
        [comp.id]: [["Preview not available for Excel in browser."]]
      }));
    }
  }}
/>
{componentPreviews[comp.id] && (
  <div className="mt-2 overflow-x-auto">
    <h4 className="font-medium text-sm mb-1">Preview:</h4>
    <table className="table-auto border-collapse border border-gray-400 text-sm">
      <tbody>
        {componentPreviews[comp.id].map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="border border-gray-300 px-2 py-1">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

                      <button type="submit" className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-blue-300">Upload</button>
                    </form>

                    <ManualMarksEntry 
                courseId={selectedCourse}
                batchId={availableBatches.find(b => b.name === group.batch)?.id}
                componentId={comp.id}
              />
                  </li>
                  
          ))}
          
        </ul>
        
      </div>
    ))}
  </div>
)}


          <form onSubmit={handleCsvUpload} className="border p-4 rounded mb-4">
            <label className="block mb-2">Upload Bulk CSV:</label>
            <input 
            type="file" 
            accept=".csv, .xlsx, .xls" 
            onChange={e => {
                   const file = e.target.files[0];
                   setCsvFile(file);
               
                   if (file) {
                     const fileExtension = file.name.split('.').pop().toLowerCase();
               
                     if (fileExtension === 'csv') {
                       Papa.parse(file, {
                         header: true,
                         skipEmptyLines: true,
                         complete: function (results) {
                           setCsvPreview(results.data.slice(0, 5));
                         },
                       });
                     } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                       const reader = new FileReader();
                       reader.onload = function (e) {
                         const data = new Uint8Array(e.target.result);
                         const workbook = XLSX.read(data, { type: 'array' });
                         const sheetName = workbook.SheetNames[0];
                         const worksheet = workbook.Sheets[sheetName];
                         const jsonData = XLSX.utils.sheet_to_json(worksheet);
                         setCsvPreview(jsonData.slice(0, 5));
                       };
                       reader.readAsArrayBuffer(file);
                     } else {
                       alert('Unsupported file type. Please upload a CSV or Excel file.');
                     }
                   }
                 }}
               className="mb-2" />
               {csvPreview.length > 0 && (
  <div className="mt-4">
    <h5 className="font-semibold mb-2">CSV Preview (First 5 Rows):</h5>
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

            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-blue-300">Upload</button>
          </form>

          <form onSubmit={handleComponentSubmit} className="border p-4 rounded mb-4">
            <h4 className="text-lg font-semibold mb-2">Add Evaluation Component</h4>
            <input type="text" placeholder="Component Name" className="block mb-2 p-2 border" value={componentForm.name} onChange={e => setComponentForm({ ...componentForm, name: e.target.value })} />
            <input type="number" placeholder="Max Score" className="block mb-2 p-2 border" value={componentForm.max_score} onChange={e => setComponentForm({ ...componentForm, max_score: e.target.value })} />
            <input type="number" placeholder="Weightage (%)" className="block mb-2 p-2 border" value={componentForm.weightage} onChange={e => setComponentForm({ ...componentForm, weightage: e.target.value })} />
            <input type="text" placeholder="Group Name (Eg: Quizzes, Assignments)" className="block mb-2 p-2 border" value={componentForm.group_name} onChange={e => setComponentForm({ ...componentForm, group_name: e.target.value })} />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">Add Component</button>
          </form>

          <form onSubmit={handleRuleSubmit} className="border p-4 rounded">
            <h4 className="text-lg font-semibold mb-2">Set Rule (Best of Count)</h4>
            <input type="text" placeholder="Component(Eg: Quizzes, Assignments)" className='block mb-2 p-2 border' value={evaluationGroup} onChange={e => setEvaluationGroup(e.target.value)} />
            <input type="number" placeholder="Best of N quizzes" className="block mb-2 p-2 border" value={bestOf} onChange={e => setBestOf(e.target.value)} />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-blue-300">Set Rule</button>
          </form>


        </div>
        
        
      )}
    </div>
  );
};

export default ProfessorDashboard;