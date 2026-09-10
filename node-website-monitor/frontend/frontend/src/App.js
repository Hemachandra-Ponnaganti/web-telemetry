import './App.css';
import { useState } from 'react';

function App() {

  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);

  // Run Scan Function
  const runScan = async () => {

    if (!url) {
      alert("Enter website URL");
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/analyze/?url=${url}`
      );

      const result = await response.json();

      console.log(result);

      setData(result);

    } catch (error) {
      console.log(error);
      alert("Backend connection error");
    }
  };

  return (
    <div className="app">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>MonitorPro</h2>
        <p className="subtitle">Enterprise SRE</p>

        <ul>
          <li>Performance</li>
          <li>SEO</li>
          <li>Technical Health</li>
          <li>UI Consistency</li>
          <li>Security</li>
          <li>Settings</li>
        </ul>

        <button className="audit-btn">
          New Audit
        </button>
      </div>

      {/* Main Dashboard */}
      <div className="main-content">

        <div className="topbar">

          <input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button
            className="scan-btn"
            onClick={runScan}
          >
            Run Scan
          </button>

        </div>

        {/* Hero */}
        <div className="hero-card">

          <h1>Website Monitoring Dashboard</h1>

          <p>
            Analyze website performance, SEO,
            errors, and image optimization.
          </p>

        </div>

        {/* Results */}
        {data && (

          <div className="cards">

            <div className="card blue">
              <h3>Status</h3>
              <h1>{data.check.status_code}</h1>
              
            </div>

            <div className="card gray">
              <h3>Load Time</h3>
              <h1>{data.check.load_time}</h1>
          
            </div>

            <div className="card blue">
              <h3>SEO Title</h3>
              <h1>{data.seo.title.text}</h1>
            </div>

            <div className="card red">
              <h3>Total Images</h3>
              <h1>{data.images.total_images}</h1>
            </div>

            <div className="card">
              <h3>Alert</h3>
              <h1>{data.check.alerts?.[0]?.message || "NO Alerts "}</h1>
            </div>

          </div>

        )}

      </div>
    </div>
  );
}

export default App;