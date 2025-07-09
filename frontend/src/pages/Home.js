import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="p-6 flex flex-col items-center space-y-8">
      <link rel="stylesheet" href="medstyle.css"></link>
      <h1 className="text-4xl font-bold">Home</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
        <Link id='adc' to="/student/register" className="bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600">
          Register as Student
        </Link>
        <Link id='qwe' to="/professor/register" className="bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600">
          Register as Professor
        </Link>
        <Link id='adc' to="/student/login" className="bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600">
          Login as Student
        </Link>
        <Link id='adc' to="/professor/login" className="bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600">
          Login as Professor
        </Link>
      </div>
    </div>
  );
}

export default Home;
