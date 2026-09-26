import 'dotenv/config';

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. See backend/.env.example.`);
  return v;
}

export const env = {
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  gmailUser: process.env.GMAIL_USER || '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
  // Returns the reset code in the API response so demos don't depend on email. Never enable for real users.
  exposeDevOtp: process.env.EXPOSE_DEV_OTP === 'true',
  seedDemo: process.env.SEED_DEMO === 'true',
};
