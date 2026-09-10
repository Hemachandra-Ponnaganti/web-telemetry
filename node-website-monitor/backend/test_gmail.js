const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../sre_settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

const hostUser = settings.email_host_user;
const hostPass = settings.email_host_password;
const recipient = settings.critical_email;

console.log('Credentials loaded:', { hostUser, recipient });

const run = async () => {
  const isGmail = hostUser.toLowerCase().includes('@gmail.com');
  console.log('Using standard config:');
  const transporter1 = nodemailer.createTransport(
    isGmail ? {
      service: 'gmail',
      auth: { user: hostUser, pass: hostPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    } : {
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT) || 25,
      secure: process.env.EMAIL_USE_SSL === 'true',
      auth: { user: hostUser, pass: hostPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    }
  );

  try {
    console.log('Sending via Transporter 1...');
    await transporter1.sendMail({
      from: hostUser,
      to: recipient,
      subject: 'Test Transporter 1',
      text: 'Hello from Transporter 1'
    });
    console.log('Transporter 1 Success!');
  } catch (err) {
    console.error('Transporter 1 Error:', err);
  }

  console.log('\nUsing service: gmail config:');
  const transporter2 = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: hostUser, pass: hostPass }
  });

  try {
    console.log('Sending via Transporter 2...');
    await transporter2.sendMail({
      from: hostUser,
      to: recipient,
      subject: 'Test Transporter 2',
      text: 'Hello from Transporter 2'
    });
    console.log('Transporter 2 Success!');
  } catch (err) {
    console.error('Transporter 2 Error:', err);
  }
};

run();
