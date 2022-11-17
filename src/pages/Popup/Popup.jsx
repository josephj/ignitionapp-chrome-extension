import React from 'react';
import {
  Button,
  Heading,
  ChakraProvider,
  HStack,
  Stack,
  Center,
  useBoolean,
  Switch,
  Badge,
  Text,
  FormLabel,
  Flex,
} from '@chakra-ui/react';
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
  mutation seedPracticeWithPayments {
    seedPracticeWithPayments(input: {}) {
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
  const [isProcessing, setProcessing] = useBoolean(false);
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
    setProcessing.on();
    const { practiceId, email } = await createBasePractice({
      name: 'Hello Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_STANDARD_ACCOUNT,
      variables: { practiceId },
    });
    await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/dashboard' });
    setProcessing.off();
  };

  const handleCreateAccountPayment = async () => {
    setProcessing.on();
    const { data } = await devClient.mutate({
      mutation: MUTATION_CREATE_ACCOUNT_WITH_PAYMENTS,
    });
    const { email } = data.seedPracticeWithPayments.practice.principal;
    await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/settings/payments' });
    setProcessing.off();
  };

  const handleCreateAccountQuickBooks = async () => {
    setProcessing.on();
    const { practiceId, email } = await createBasePractice({
      name: 'Quickbook Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_ACCOUNT_WITH_QBO,
      variables: { practiceId },
    });
    await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/apps' });
    setProcessing.off();
  };

  const handleCreateAccountXero = async () => {
    setProcessing.on();
    const { practiceId, email } = await createBasePractice({
      name: 'Xero Hacker',
    });
    await devClient.mutate({
      mutation: MUTATION_CREATE_ACCOUNT_WITH_XERO,
      variables: { practiceId },
    });
    await signIn({ email });
    chrome.tabs.update({ url: 'http://localhost:3000/apps' });
    setProcessing.off();
  };

  const handleCreateAccountDraftProposal = async () => {
    setProcessing.on();
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
    setProcessing.off();
  };

  const cmiScore = getRandomScore();
  const healthScore = getRandomScore();

  if (loading) {
    return (
      <Flex alignItems="center" justifyContent="center" className="App">
        <img src={logo} className="App-logo App-logo-spin" alt="logo" />
      </Flex>
    );
  }

  return (
    <ChakraProvider>
      <Stack className="App" spacing="24px">
        <Stack as="header">
          <Center>
            <img src={logo} className="App-logo" alt="logo" />
          </Center>
          <Heading as="h1" size="lg" isTruncated>
            {currentPractice.name}
          </Heading>
          {renewDate && (
            <div style={{ fontSize: '16px', color: 'pink' }}>
              Renew Date: {renewDate}
            </div>
          )}
        </Stack>

        <HStack as="section" px="50px">
          <section style={{ width: '50%' }}>
            <Heading as="h2" size="sm" isTruncated>
              CMI Score
            </Heading>
            <Text
              color={cmiScore > 5 ? 'green' : 'red'}
              fontWeight="bold"
              fontSize="36px"
            >
              {cmiScore}
            </Text>
          </section>
          <section style={{ width: '50%' }}>
            <Heading as="h2" size="sm" isTruncated>
              Health Score
            </Heading>
            <Text
              color={healthScore > 5 ? 'green' : 'red'}
              fontWeight="bold"
              fontSize="36px"
            >
              {healthScore}
            </Text>
          </section>
        </HStack>

        <Stack as="section" px="50px">
          <Heading as="h2" size="sm" isTruncated>
            Acknowledgement
          </Heading>
          <Stack>
            {acknowledgements.map(({ id, level }) => (
              <HStack key={id}>
                <Switch
                  defaultChecked
                  isDisabled={isProcessingRemoveAck || isProcessingAddAck}
                  onChange={(e) => handleToggleAck(id, level, e.target.checked)}
                  {...{ id }}
                />
                <FormLabel fontSize="12px" htmlFor={id}>
                  {id}
                </FormLabel>
                <Badge
                  colorScheme="yellow"
                  fontSize="10px"
                  size="small"
                  textTransform="lowercase"
                >
                  {level}
                </Badge>
              </HStack>
            ))}
          </Stack>
        </Stack>

        <Stack as="section">
          <Heading as="h2" size="sm" isTruncated>
            Create Accounts
          </Heading>
          <Stack px="50px">
            <Button
              colorScheme="purple"
              onClick={handleCreateAccountStandard}
              isLoading={isProcessing}
              size="xs"
            >
              Create Standard Account
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateAccountPayment}
              isLoading={isProcessing}
              size="xs"
            >
              Account With Payments
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateAccountQuickBooks}
              isLoading={isProcessing}
              size="xs"
            >
              Account With Qbo Integration
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateAccountXero}
              isLoading={isProcessing}
              size="xs"
            >
              Account With Xero Integration
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateAccountDraftProposal}
              isLoading={isProcessing}
              size="xs"
            >
              Account With Draft Proposal
            </Button>
          </Stack>
        </Stack>

        <Stack as="section" px="50px">
          <Heading as="h2" size="sm" isTruncated>
            Refined Ignition
          </Heading>
          <HStack justifyContent="center">
            <Switch defaultChecked={false} id="enable-comic-sans" />
            <FormLabel fontSize="12px" htmlFor="enable-comic-sans">
              Using Comic Sans
            </FormLabel>
          </HStack>
        </Stack>
      </Stack>
    </ChakraProvider>
  );
};

export default Popup;
