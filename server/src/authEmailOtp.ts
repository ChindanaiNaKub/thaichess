import './env';

type AuthEmailOtpType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || '';
const AUTH_FROM_EMAIL = process.env.AUTH_FROM_EMAIL?.trim() || '';

function getAuthEmailOtpSubject(type: AuthEmailOtpType) {
  switch (type) {
    case 'email-verification':
      return 'Verify your ThaiChess email';
    case 'forget-password':
      return 'Reset your ThaiChess password';
    case 'change-email':
      return 'Change your ThaiChess email';
    case 'sign-in':
    default:
      return 'Your ThaiChess sign-in code';
  }
}

function getAuthEmailOtpText(otp: string, type: AuthEmailOtpType) {
  switch (type) {
    case 'email-verification':
      return `Your ThaiChess email verification code is ${otp}. It expires in 10 minutes.`;
    case 'forget-password':
      return `Your ThaiChess password reset code is ${otp}. It expires in 10 minutes.`;
    case 'change-email':
      return `Your ThaiChess email change code is ${otp}. It expires in 10 minutes.`;
    case 'sign-in':
    default:
      return `Your ThaiChess sign-in code is ${otp}. It expires in 10 minutes.`;
  }
}

export async function sendAuthEmailOtp(params: {
  email: string;
  otp: string;
  type: AuthEmailOtpType;
}): Promise<void> {
  const { email, otp, type } = params;

  if (RESEND_API_KEY && AUTH_FROM_EMAIL) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: AUTH_FROM_EMAIL,
        to: [email],
        subject: getAuthEmailOtpSubject(type),
        text: getAuthEmailOtpText(otp, type),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Email delivery failed: ${body}`);
    }

    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  throw new Error('Email delivery is not configured.');
}
