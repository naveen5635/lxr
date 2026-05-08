import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import SessionMonitor from './pages/SessionMonitor.jsx';
import StudentView from './pages/StudentView.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                        element={<Home />} />
        <Route path="/teacher"                 element={<TeacherDashboard />} />
        <Route path="/teacher/session/:id"     element={<SessionMonitor />} />
        <Route path="/student"                 element={<StudentView />} />
        <Route path="*"                        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
