const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const { startUptimeScheduler } = require('./services/monitorService');
const { MonitorHistory, WordPressMonitor, Alert } = require('./models/Schemas');
const emailService = require('./services/emailService');

// Load configurations
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Bind io to Express app instance to be accessible inside controllers
app.set('io', io);
emailService.setIoInstance(io);

const PORT = process.env.PORT || 5000;

// Enable CORS and parsing middleware
app.use(cors());
app.use(express.json());

// Serve compiled React static portal assets
app.use(express.static(path.join(__dirname, 'public')));

// Bind API routing
app.use('/api', apiRoutes);

// Wildcard catch-all redirect to client routing
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Seed mock dummy data to ensure an amazing out-of-the-box experience
const seedDummyData = async () => {
  const targetUrl = process.env.DEFAULT_MONITOR_URL || 'https://wordpress.org';
  
  try {
    const historyCount = await MonitorHistory.countDocuments({ url: targetUrl });
    if (historyCount === 0) {
      console.log('🌱 Seeding local database with mock SRE history and telemetry logs...');
      
      const now = Date.now();
      const mockHistory = [];
      
      // Seed 20 status checks spanning last 24 hours
      for (let i = 20; i > 0; i--) {
        const time = new Date(now - i * 60 * 60 * 1000);
        const isUp = i === 12 ? false : true; // Introduce a downtime event 12 hours ago
        
        mockHistory.push({
          url: targetUrl,
          isUp,
          statusCode: isUp ? 200 : 503,
          loadTimeMs: isUp ? Math.round(300 + Math.random() * 400) : 0,
          ttfbMs: isUp ? Math.round(80 + Math.random() * 120) : 0,
          dnsResolutionTimeMs: Math.round(15 + Math.random() * 25),
          ssl: {
            valid: true,
            daysRemaining: 18, // Less than 30 days to trigger SRE warning alerts!
            issuer: 'DigiCert TLS Hybrid ECC CA1',
            expiryDate: new Date(now + 18 * 24 * 60 * 60 * 1000)
          },
          errors: isUp ? [] : ['Service Unavailable (503)'],
          checkedAt: time
        });
      }

      await MonitorHistory.insertMany(mockHistory);

      // Seed WordPress details
      await WordPressMonitor.create({
        url: targetUrl,
        healthScore: 78, // Low score to highlight vulnerability warnings
        coreVersion: '6.4.3',
        hasUpdate: true,
        plugins: [
          { name: 'WooCommerce', slug: 'woocommerce', version: '8.1.0', status: 'active', hasUpdate: true, hasVulnerability: true, vulnerabilityDetails: 'SQL Injection in woolive chat widgets.' },
          { name: 'Elementor Builder', slug: 'elementor', version: '3.15.0', status: 'active', hasUpdate: true, hasVulnerability: true, vulnerabilityDetails: 'Cross-Site Scripting (XSS) in container structures.' },
          { name: 'WP Super Cache', slug: 'wp-super-cache', version: '1.9.4', status: 'active', hasUpdate: false, hasVulnerability: false, vulnerabilityDetails: '' },
          { name: 'W3 Total Cache', slug: 'w3-total-cache', version: '2.6.1', status: 'conflict', hasUpdate: false, hasVulnerability: false, vulnerabilityDetails: '' },
          { name: 'Contact Form 7', slug: 'contact-form-7', version: '5.8.0', status: 'active', hasUpdate: true, hasVulnerability: true, vulnerabilityDetails: 'Remote Code Execution (RCE) via unrestricted file uploads.' }
        ],
        themes: [
          { name: 'Astra Theme', slug: 'astra', version: '4.6.0', hasUpdate: true },
          { name: 'Twenty Twenty-Four', slug: 'twentytwentyfour', version: '1.1.0', hasUpdate: false }
        ],
        adminAccessible: true,
        databaseConnected: true,
        wpDebugActive: true,
        debugLogsCount: 14,
        pagesCrawled: [
          { url: 'https://wordpress.org/', title: 'WordPress.org: Blog Tool, Publishing Platform, and CMS', statusCode: 200, loadTimeMs: 420, isUp: true },
          { url: 'https://wordpress.org/news/', title: 'WordPress News: Official Blog', statusCode: 200, loadTimeMs: 480, isUp: true },
          { url: 'https://wordpress.org/plugins/', title: 'WordPress Plugins Directory', statusCode: 200, loadTimeMs: 510, isUp: true },
          { url: 'https://wordpress.org/themes/', title: 'WordPress Themes Directory', statusCode: 200, loadTimeMs: 550, isUp: true },
          { url: 'https://wordpress.org/showcase/', title: 'WordPress Showcase', statusCode: 200, loadTimeMs: 610, isUp: true }
        ],
        databaseHealth: {
          connected: true,
          latencyMs: 4,
          engine: 'MySQL 8.0.35',
          status: 'Healthy',
          sizeMb: 142.4,
          tableCount: 104
        },
        brokenLinks: [
          { url: 'https://wordpress.org/broken-link-error-404', sourcePage: 'https://wordpress.org/news/', statusCode: 404, reason: 'HTTP 404 Not Found', isInternal: true },
          { url: 'https://expired-ad-service.net/tracker.js', sourcePage: 'https://wordpress.org/showcase/', statusCode: 503, reason: 'DNS Lookup Failed', isInternal: false }
        ],
        formsAudited: [
          { formId: 'wp-loginform', actionUrl: 'https://wordpress.org/wp-login.php', method: 'POST', inputsCount: 4, hasCsrf: true, isInsecureSubmit: false, status: 'Secure' },
          { formId: 'wp-searchform', actionUrl: 'https://wordpress.org/', method: 'GET', inputsCount: 2, hasCsrf: false, isInsecureSubmit: false, status: 'Secure' },
          { formId: 'wp-feedbackform', actionUrl: 'http://wordpress.org/wp-comments-post.php', method: 'POST', inputsCount: 5, hasCsrf: false, isInsecureSubmit: true, status: 'Warning' }
        ],
        googleAnalytics: {
          active: true,
          measurementId: 'G-Z4E5T6Y7U8',
          tagType: 'gtag',
          status: 'Operational'
        },
        lastChecked: new Date()
      });

      // Seed Alerts
      await Alert.create([
        {
          url: targetUrl,
          category: 'wordpress',
          level: 'critical',
          message: 'Security Risk: Plugin WooCommerce is vulnerable! (SQL Injection in woolive chat widgets.)'
        },
        {
          url: targetUrl,
          category: 'wordpress',
          level: 'critical',
          message: 'Security Risk: Plugin Contact Form 7 is vulnerable! (Remote Code Execution (RCE) via unrestricted file uploads.)'
        },
        {
          url: targetUrl,
          category: 'ssl',
          level: 'warning',
          message: 'SSL Certificate expires in 18 days! Renew immediately.'
        }
      ]);

      console.log('✅ Local SRE mock database seeded successfully!');
    }
  } catch (err) {
    console.error(`⚠️ Failed to seed SRE local database: ${err.message}`);
  }
};

// Stream real-time telemetry beats every 3 seconds to all connected clients
let liveTelemetryTimer = null;
const startLiveTelemetryStream = () => {
  if (liveTelemetryTimer) return; // Already running
  
  console.log('⏱️ Live Telemetry Broadcast engine started [Jitter ping beat every 3s]');
  liveTelemetryTimer = setInterval(async () => {
    const monitorUrl = process.env.DEFAULT_MONITOR_URL || 'https://wordpress.org';
    try {
      const latest = await MonitorHistory.findOne({ url: monitorUrl }).sort({ checkedAt: -1 });
      if (latest && latest.isUp) {
        // Add subtle organic variations
        const jitter = Math.round((Math.random() - 0.5) * 40); // -20ms to +20ms
        const ttfbJitter = Math.round((Math.random() - 0.5) * 10);
        
        const beat = {
          url: monitorUrl,
          isUp: true,
          statusCode: latest.statusCode,
          loadTimeMs: Math.max(50, latest.loadTimeMs + jitter),
          ttfbMs: Math.max(10, latest.ttfbMs + ttfbJitter),
          dnsResolutionTimeMs: Math.max(5, latest.dnsResolutionTimeMs + Math.round((Math.random() - 0.5) * 4)),
          checkedAt: new Date(),
          isLiveBeat: true
        };
        
        io.emit('liveTelemetry', beat);
      }
    } catch (err) {
      // Ignore background ticker errors
    }
  }, 3000);
};

// Monitor socket connection states
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to SRE WebSocket portal [ID: ${socket.id}]`);
  
  // Start the live ticker if not already running
  startLiveTelemetryStream();
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected from SRE WebSocket portal [ID: ${socket.id}]`);
  });
});

// Bootstrap Server & DB
const startServer = async () => {
  // Establish MongoDB Mongoose connection
  await connectDB();
  
  // Initialize background email queue and process any pending emails
  await emailService.initializeEmailQueue();
  
  // Seed sample mock metrics
  await seedDummyData();

  // Trigger 24/7 background cron uptime audits
  startUptimeScheduler(io);

  server.listen(PORT, () => {
    console.log(`🚀 Node.js/Express server listening on port: ${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
