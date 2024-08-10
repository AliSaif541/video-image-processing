import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileUpload from './pages/FileUpload'

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<FileUpload />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
