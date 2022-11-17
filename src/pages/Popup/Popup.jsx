import React from 'react';
import {
  useQuery,
  useMutation,
  gql,
  ApolloClient,
  InMemoryCache,
} from '@apollo/client';

import logo from '../../assets/img/logo.svg';
import './Popup.css';

const MUTATION_CREATE_BASE_ACCOUNT = gql`
  mutation createPractice($name: String!) {
    createPractice(input: { name: $name }) {
      practice {
        id
        name
        principal {
          email
        }
      }
    }
  }
`;

const MUTATION_CREATE_STANDARD_ACCOUNT = gql`
  mutation seedStandardPractice($practiceId: ID!) {
    seedStandardPractice(input: { practiceId: $practiceId }) {
      practice {
        id
        name
        principal {
          email
        }
      }
    }
  }
`;

const MUTATION_CREATE_ACCOUNT_WITH_PAYMENTS = gql`
  mutation seedPracticeWithPayments($practiceId: ID!) {
    seedPracticeWithPayments(input: { practiceId: $practiceId }) {
      practice {
        id
        name
        principal {
          email
        }
      }
    }
  }
`;

const MUTATION_CREATE_ACCOUNT_WITH_XERO = gql`
  mutation seedStandardPractice($practiceId: ID!) {
    seedStandardPractice(
      input: { practiceId: $practiceId, integrations: ["xero"] }
    ) {
      practice {
        id
        name
        principal {
          email
        }
      }
    }
  }
`;

const MUTATION_CREATE_ACCOUNT_WITH_QBO = gql`
  mutation seedStandardPractice($practiceId: ID!) {
    seedStandardPractice(
      input: { practiceId: $practiceId, integrations: ["qbo"] }
    ) {
      practice {
        id
        name
        principal {
          email
        }
      }
    }
  }
`;

const MUTATION_CREATE_ACCOUNT_WITH_DRAFT_PROPOSAL = gql`
  mutation seedStandardPractice($practiceId: ID!) {
    seedStandardPractice(
      input: { practiceId: $practiceId, proposalsTraits: ["draft"] }
    ) {
      practice {
        id
        name
        principal {
          email
        }
      }
    }
  }
`;

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

const MUTATION_ADD_ACK = gql`
  mutation removeAcknowledgement($id: ID!, $level: AcknowledgementLevel!) {
    acknowledgementAdd(input: { id: $id, level: $level }) {
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
      id
      name
      billing {
        currentSubscription {
          renewDate
        }
      }
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

const MUTATION_USER_LOGIN = gql`
  mutation userLogin($email: EmailAddress!) {
    userLogin(
      input: { email: $email, password: "correct horse battery staple" }
    ) {
      accessToken
      oneTimePasswordRequired
      mfaInfo {
        id
        enabled
        readyForSetup
        setupSkippable
        setupRequiredFrom
        sources {
          deliveryMethod
        }
      }
    }
  }
`;

const getRandomScore = () => {
  return Math.ceil(Math.random() * 10 * 100) / 100;
};

const authClient = new ApolloClient({
  uri: 'http://localhost:3000/auth-api/graphql',
  cache: new InMemoryCache(),
});

const devClient = new ApolloClient({
  uri: 'http://localhost:3000/dev_api/graphql',
  cache: new InMemoryCache(),
});

const createBasePractice = async ({ name = 'Hacker' } = {}) => {
  const { data } = await devClient.mutate({
    mutation: MUTATION_CREATE_BASE_ACCOUNT,
    variables: { name },
  });

  const {
    id: practiceId,
    principal: { email },
  } = data.createPractice.practice;

  return { practiceId, email };
};

const signIn = async ({ email }) => {
  const { data } = await authClient.mutate({
    mutation: MUTATION_USER_LOGIN,
    variables: { email },
  });

  return data.userLogin;
};

const Popup = () => {
  const { loading, data } = useQuery(QUERY);
  const [removeAcknowledgement, { loading: isProcessingRemoveAck }] =
    useMutation(MUTATION_REMOVE_ACK);
  const [addAcknowledgement, { loading: isProcessingAddAck }] =
    useMutation(MUTATION_ADD_ACK);

  const { currentPractice, acknowledgements } = data || {};
  const { renewDate } = currentPractice?.billing?.currentSubscription || {};

  const handleToggleAck = async (id, level, checked) => {
    if (!checked) {
      await removeAcknowledgement({ variables: { id, level } });
    } else {
      await addAcknowledgement({ variables: { id, level } });
    }
  };

  const handleCreateAccountStandard = async () => {
    const { practiceId, email } = await createBasePractice({
      name: 'Hello Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_STANDARD_ACCOUNT,
      variables: { practiceId },
    });
    const authData = await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/dashboard' });
    // console.log("-> authData", authData);
  };

  const handleCreateAccountPayment = async () => {
    const { practiceId, email } = await createBasePractice({
      name: 'Payment Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_ACCOUNT_WITH_PAYMENTS,
      variables: { practiceId },
    });
    await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/settings/payments' });
  };

  const handleCreateAccountQuickBooks = async () => {
    const { practiceId, email } = await createBasePractice({
      name: 'Quickbook Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_ACCOUNT_WITH_QBO,
      variables: { practiceId },
    });
    await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/apps' });
  };

  const handleCreateAccountXero = async () => {
    const { practiceId, email } = await createBasePractice({
      name: 'Xero Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_ACCOUNT_WITH_XERO,
      variables: { practiceId },
    });
    await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/apps' });
  };

  const handleCreateAccountDraftProposal = async () => {
    const { practiceId, email } = await createBasePractice({
      name: 'Proposal Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_ACCOUNT_WITH_DRAFT_PROPOSAL,
      variables: { practiceId },
    });
    await signIn({ email });
    chrome.tabs.update({
      url: 'http://localhost:3000/pipeline?page=1&status=DRAFT',
    });
  };

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo App-logo-spin" alt="logo" />
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{currentPractice.name}</p>
        {renewDate && (
          <div style={{ fontSize: '16px', color: 'pink' }}>
            Renew Date: {renewDate}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            width: '90%',
            margin: '0 auto',
          }}
        >
          <section style={{ width: '50%' }}>
            <h3>CMI Score</h3>
            <div>{getRandomScore()}</div>
          </section>
          <section style={{ width: '50%' }}>
            <h3>Health Score</h3>
            <div>{getRandomScore()}</div>
          </section>
        </div>

        <hr />

        <section>
          <h3>Acknowledgement</h3>
          <ul>
            {acknowledgements.map(({ id, level }) => (
              <li
                key={id}
                style={{
                  display: 'flex',
                  verticalAlign: 'middle',
                  textAlign: 'left',
                  fontSize: '10px',
                }}
              >
                <label>
                  <input
                    type="checkbox"
                    disabled={isProcessingRemoveAck || isProcessingAddAck}
                    defaultChecked={true}
                    onChange={(e) =>
                      handleToggleAck(id, level, e.target.checked)
                    }
                  />
                  {`${id} (${level})`}
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Create Accounts</h3>
          <ul style={{ textAlign: 'left', listStyleType: 'none' }}>
            <li>
              <button onClick={handleCreateAccountStandard}>
                Create Standard Account
              </button>
            </li>
            <li>
              <button onClick={handleCreateAccountPayment}>
                Account With Payments
              </button>
            </li>
            <li>
              <button onClick={handleCreateAccountQuickBooks}>
                Account With Quickbooks Integration
              </button>
            </li>
            <li>
              <button onClick={handleCreateAccountXero}>
                Account With Xero Integration
              </button>
            </li>
            <li>
              <button onClick={handleCreateAccountDraftProposal}>
                Account With Draft Proposal
              </button>
            </li>
          </ul>
        </section>
      </header>
    </div>
  );
};

export default Popup;
