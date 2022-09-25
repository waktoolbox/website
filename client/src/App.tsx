import React from 'react';
import './App.css';
import DiscordOAuth from "./components/oauth/discord";

function App() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if(token) {
    localStorage.setItem('token', token);
    window.location.replace(window.location.origin);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src="/logo.svg" className="App-logo" alt="logo" />
        <DiscordOAuth/>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
