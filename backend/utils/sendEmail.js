const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (toEmail, otp) => {
  const { data, error } = await resend.emails.send({
    from: 'PingTalk <onboarding@resend.dev>',
    to: toEmail,
    subject: 'PingTalk - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color: #25D366;">Welcome to PingTalk!</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 5px; color: #333;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('DEBUG: Resend returned an error:', error);
    throw new Error(error.message || 'Failed to send email via Resend');
  }

  console.log('DEBUG: Resend accepted the email, id:', data.id);
};

module.exports = sendOTPEmail;