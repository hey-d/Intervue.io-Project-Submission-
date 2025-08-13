import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TeacherPage from "./pages/TeacherPage.jsx";
import StudentPage from "./pages/StudentPage.jsx";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col items-center gap-6">
              <h1 className="text-4xl font-bold text-indigo-600">Live Polling System</h1>
              <div className="flex gap-4">
                <Link to="/teacher" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                  Teacher
                </Link>
                <Link to="/student" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                  Student
                </Link>
              </div>
            </div>
          }/>
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/student" element={<StudentPage />} />
        </Routes>
      </div>
    </Router>
  );
}
