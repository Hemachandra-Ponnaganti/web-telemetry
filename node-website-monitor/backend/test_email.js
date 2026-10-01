const path = require('path');
const { sendAlertEmail, sendAlertEmailToWebsite } = require('./src/services/emailService');

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://monitorpro:XRE2026@cluster0.monitorpro.mongodb.net/web-monitor?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to DB');
  try {
    await sendAlertEmail('https://example.com', 'test', 'info', 'Test from script');
    console.log('Email enqueued. Waiting 10 seconds...');
    setTimeout(() => {
        console.log('Done wait');
        process.exit(0);
    }, 10000);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
