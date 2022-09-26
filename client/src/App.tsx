import React from 'react';
import {useTranslation} from "react-i18next";
import './App.css';
import DiscordOAuth from "./components/oauth/discord";
import LanguagePicker from "./components/language-picker";

function App() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem('token', token);
    window.location.replace(window.location.origin);
  }

  const {t} = useTranslation();

  return (
      <div className="App">
        <header className="App-header">
          <img src="/logo.svg" className="App-logo" alt="logo"/>
          <LanguagePicker/>
          <DiscordOAuth/>
          <a
              className="App-link"
              href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
            {t('title')}
        </a>
      </header>
    </div>
  );
}

export default App;
