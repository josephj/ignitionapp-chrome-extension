import React from 'react';
import { render } from 'react-dom';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';

import Popup from './Popup';
import './index.css';
import logo from '../../assets/img/logo.svg';

const getHostUrl = (url) => {
  if (url.includes('https://demo.ignitionapp.com')) {
    return 'https://demo.ignitionapp.com';
  }

  if (url.includes('http://localhost:3000')) {
    return 'http://localhost:3000';
  }

  if (url.includes('https://go.ignitionapp.com')) {
    return 'https://go.ignitionapp.com';
  }

  return null;
};



(async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = tabs[0].url;
  const hostUrl = getHostUrl(tabUrl);
  const rootEl = window.document.querySelector('#app-container');

  const handleRedirect = (env) => () => {
    switch (env) {
      case 'production':
        chrome.tabs.update({ url: 'https://go.ignitionapp.com' });
        break;
      case 'demo':
        chrome.tabs.update({ url: 'https://demo.ignitionapp.com' });
        break;
      case 'dev':
        chrome.tabs.update({ url: 'https://localhost:3000' });
        break;
    }
  };

  if (!hostUrl) {
    render(
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>You can only use this extension when browsing IgnitionApp</p>
        <center>
          <button onClick={handleRedirect('production')}>
            Go to Production
          </button>
          <button onClick={handleRedirect('demo')}>Go to Demo</button>
          <button onClick={handleRedirect('dev')}>Go to Dev</button>
        </center>
        </header>
      </div>,
      rootEl
    );
    return;
  }

  // const { value: sessionId } = await chrome.cookies.get({
  //   url: hostUrl,
  //   name: '_session_id',
  // });
  // console.log("-> sessionId", sessionId);
  //
  // await chrome.cookies.set({
  //   url: 'http://localhost:3000',
  //   name: '_session_id',
  //   value: sessionId,
  // });

  const { value: csrfToken } = await chrome.cookies.get({
    url: hostUrl,
    name: 'csrf_token',
  });
  console.log('-> csrfToken', csrfToken);

  const client = new ApolloClient({
    uri: `${hostUrl}/graphql`,
    cache: new InMemoryCache(),
    headers: { 'X-CSRF-Token': csrfToken },
  });

  render(
    <ApolloProvider client={client}>
      <Popup />
    </ApolloProvider>,
    rootEl
  );
})();

if (module.hot) module.hot.accept();
