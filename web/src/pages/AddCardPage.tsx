import React, { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import sendAdd_cardMutation from '../graphql/generated/mutations/add_cardMutation';

// Styled Components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const FormCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #555;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #0066cc;
  }

  &::placeholder {
    color: #aaa;
  }
`;

const CardInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const CardInput = styled(Input)`
  flex: 1;
  padding-right: 60px;
  font-family: monospace;
  letter-spacing: 2px;
`;

const CardNetworkBadge = styled.span`
  position: absolute;
  right: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
`;

const Row = styled.div`
  display: flex;
  gap: 16px;
`;

const HalfInputGroup = styled(InputGroup)`
  flex: 1;
`;

const SmallInput = styled(Input)`
  width: 100%;
`;

const Button = styled.button`
  padding: 14px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #0052a3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  text-align: center;
  padding: 10px;
  background-color: #f8d7da;
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: #155724;
  text-align: center;
  padding: 10px;
  background-color: #d4edda;
  border-radius: 4px;
`;

const FieldError = styled.span`
  color: #dc3545;
  font-size: 12px;
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #666;
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
`;

const TestCardNotice = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #856404;
  text-align: center;

  strong {
    display: block;
    margin-bottom: 4px;
  }

  code {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
`;

// Card Network Detection
type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | null;

const detectCardNetwork = (pan: string): CardNetwork => {
  const cleanPan = pan.replace(/\s/g, '');
  if (!cleanPan) return null;

  const firstDigit = cleanPan[0];
  const firstTwo = cleanPan.substring(0, 2);

  if (firstTwo === '34' || firstTwo === '37') return 'AMEX';
  if (firstDigit === '4') return 'VISA';
  if (firstDigit === '5' || firstDigit === '2') return 'MASTERCARD';
  if (firstDigit === '6' || firstTwo === '60') return 'DISCOVER';

  return null;
};

// Luhn Algorithm for card validation
const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\s/g, '').split('').map(Number);
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Format card number with gaps
const formatCardNumber = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  const chunks = [];

  for (let i = 0; i < cleanValue.length; i += 4) {
    chunks.push(cleanValue.substring(i, i + 4));
  }

  return chunks.join(' ');
};

// Form validation
interface FormErrors {
  pan?: string;
  cvv?: string;
  exp_month?: string;
  exp_year?: string;
}

const validateForm = (
  pan: string,
  cvv: string,
  exp_month: string,
  exp_year: string
): FormErrors => {
  const errors: FormErrors = {};
  const cleanPan = pan.replace(/\s/g, '');

  // PAN validation
  if (!cleanPan) {
    errors.pan = 'Card number is required';
  } else if (!/^\d+$/.test(cleanPan)) {
    errors.pan = 'Card number must contain only digits';
  } else if (cleanPan.length < 13 || cleanPan.length > 19) {
    errors.pan = 'Card number must be 13-19 digits';
  } else if (!luhnCheck(cleanPan)) {
    errors.pan = 'Invalid card number';
  }

  // CVV validation
  const cardNetwork = detectCardNetwork(cleanPan);
  const expectedCvvLength = cardNetwork === 'AMEX' ? 4 : 3;

  if (!cvv) {
    errors.cvv = 'CVV is required';
  } else if (!/^\d+$/.test(cvv)) {
    errors.cvv = 'CVV must contain only digits';
  } else if (cvv.length !== expectedCvvLength) {
    errors.cvv = `CVV must be ${expectedCvvLength} digits`;
  }

  // Expiration month validation
  if (!exp_month) {
    errors.exp_month = 'Month is required';
  } else {
    const month = parseInt(exp_month, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      errors.exp_month = 'Invalid month (01-12)';
    }
  }

  // Expiration year validation
  const currentYear = new Date().getFullYear();
  if (!exp_year) {
    errors.exp_year = 'Year is required';
  } else {
    const year = parseInt(exp_year, 10);
    if (isNaN(year) || exp_year.length !== 4) {
      errors.exp_year = 'Enter 4-digit year';
    } else if (year < currentYear) {
      errors.exp_year = 'Card has expired';
    } else if (year > currentYear + 20) {
      errors.exp_year = 'Invalid year';
    }
  }

  // Check if card is expired (current month)
  if (!errors.exp_month && !errors.exp_year) {
    const month = parseInt(exp_month, 10);
    const year = parseInt(exp_year, 10);
    const currentMonth = new Date().getMonth() + 1;

    if (year === currentYear && month < currentMonth) {
      errors.exp_month = 'Card has expired';
    }
  }

  return errors;
};

const AddCardPage: React.FC = () => {
  const [exp_month, setExpMonth] = useState('');
  const [exp_year, setExpYear] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const apollo_client = useApolloClient();
  const navigate = useNavigate();

  // Test card number (pre-filled and disabled)
  const test_card_number = '4242 4242 4242 4242';

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      setExpMonth(value);
    }
    if (fieldErrors.exp_month) {
      setFieldErrors(prev => ({ ...prev, exp_month: undefined }));
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpYear(value);
    }
    if (fieldErrors.exp_year) {
      setFieldErrors(prev => ({ ...prev, exp_year: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate expiry for test mode (must be 6+ months in future)
    const errors: FormErrors = {};
    if (!exp_month) {
      errors.exp_month = 'Month is required';
    } else {
      const month = parseInt(exp_month, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        errors.exp_month = 'Invalid month (01-12)';
      }
    }
    if (!exp_year) {
      errors.exp_year = 'Year is required';
    } else if (exp_year.length !== 4) {
      errors.exp_year = 'Enter 4-digit year';
    }

    // Check if expiry is at least 6 months in the future
    if (!errors.exp_month && !errors.exp_year) {
      const month = parseInt(exp_month, 10);
      const year = parseInt(exp_year, 10);
      const now = new Date();
      const expiry_date = new Date(year, month - 1); // month is 0-indexed
      const six_months_from_now = new Date(now.getFullYear(), now.getMonth() + 6);

      if (expiry_date < six_months_from_now) {
        errors.exp_month = 'Expiry must be at least 6 months in the future';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // Format month with leading zero
      const formattedMonth = exp_month.padStart(2, '0');

      // Send test card data (server forces 4242 test card)
      const result = await sendAdd_cardMutation(apollo_client, {
        pan: '4242424242424242',
        cvv: '123',
        exp_month: formattedMonth,
        exp_year: exp_year,
      });

      if (result.data.add_card.success) {
        setSuccess('Card added successfully!');
        // Clear form
        setExpMonth('');
        setExpYear('');
        // Redirect to my cards after a short delay
        setTimeout(() => navigate('/my-cards'), 1500);
      } else {
        setError(result.data.add_card.error?.detail || 'Failed to add card');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FormCard>
        <Title>Add Payment Card</Title>
        <TestCardNotice>
          <strong>Test Mode</strong>
          Use card <code>4242 4242 4242 4242</code> with any expiry and any CVV
        </TestCardNotice>
        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <InputGroup>
            <Label>Card Number</Label>
            <CardInputWrapper>
              <CardInput
                type="text"
                value={test_card_number}
                disabled
                style={{ backgroundColor: '#f5f5f5', color: '#666' }}
              />
              <CardNetworkBadge>VISA</CardNetworkBadge>
            </CardInputWrapper>
          </InputGroup>

          <Row>
            <HalfInputGroup>
              <Label>Expiration Month</Label>
              <SmallInput
                type="text"
                placeholder="MM"
                value={exp_month}
                onChange={handleMonthChange}
                inputMode="numeric"
                autoComplete="cc-exp-month"
              />
              {fieldErrors.exp_month && <FieldError>{fieldErrors.exp_month}</FieldError>}
            </HalfInputGroup>

            <HalfInputGroup>
              <Label>Expiration Year</Label>
              <SmallInput
                type="text"
                placeholder="YYYY"
                value={exp_year}
                onChange={handleYearChange}
                inputMode="numeric"
                autoComplete="cc-exp-year"
              />
              {fieldErrors.exp_year && <FieldError>{fieldErrors.exp_year}</FieldError>}
            </HalfInputGroup>
          </Row>

          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Add Card'}
          </Button>
        </Form>

        <SecurityNote>
          <span>Test mode - using 4242 test card</span>
        </SecurityNote>

        <LinkText>
          <Link to="/">Back to Home</Link>
        </LinkText>
      </FormCard>
    </Container>
  );
};

export default AddCardPage;
