import React, { useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';

import logo from '../../assets/img/logo.svg';
import './Popup.css';

async function getCurrentTabUrl() {
  const tabs = await chrome.tabs.query({ active: true });
  return tabs[0].url;
}

const QUERY = gql`
  query GetCurrentPractice {
    currentPractice {
      name
      timeZone {
        code
        name
        utcOffset
      }
      countryCode
      trialEndDate
      plan {
        code
        price {
          format
        }
        priceMonthly {
          format
        }
        support {
          escaped
        }
        billingPeriod
      }
    }
    acknowledgements {
      id
      level
      updatedAt
    }
  }
`;

const Popup = () => {
  const { loading, data } = useQuery(QUERY);

  useEffect(() => {
    getCurrentTabUrl().then((data) => console.log(data));
  }, []);

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
      </div>
    );
  }

  const { currentPractice, acknowledgements } = data;

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{currentPractice.name}</p>
      </header>
    </div>
  );
};

export default Popup;
