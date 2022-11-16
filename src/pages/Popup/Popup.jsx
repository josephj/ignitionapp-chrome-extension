import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

import logo from '../../assets/img/logo.svg';
import './Popup.css';

const MUTATION_REMOVE_ACK = gql`
  mutation removeAcknowledgement($id: ID!, $level: AcknowledgementLevel!) {
    acknowledgementRemove(input: { id: $id, level: $level }) {
      acknowledgements {
        id
        level
        updatedAt
      }
    }
  }
`;

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
  const [removeAcknowledgement, { loading: isProcessing }] =
    useMutation(MUTATION_REMOVE_ACK);

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo App-logo-spin" alt="logo" />
        </header>
      </div>
    );
  }

  const { currentPractice, acknowledgements } = data;

  const handleToggleAck = async (id, level, checked) => {
    if (!checked) {
      await removeAcknowledgement({ variables: { id, level } });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{currentPractice.name}</p>
        <ul>
          {acknowledgements.map(({ id, level }) => (
            <li key={id} style={{ display: 'flex', verticalAlign: 'middle', textAlign: 'left', fontSize: '10px' }}>
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => handleToggleAck(id, level, e.target.checked)}
              />
              <span>{`${id} (${level})`}</span>
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
};

export default Popup;
