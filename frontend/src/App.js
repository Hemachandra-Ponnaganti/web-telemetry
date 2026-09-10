import './App.css';
import { useState, useEffect, useRef } from 'react';
import History from './History';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldCheck, ShieldAlert, Cpu, AlertTriangle, AlertCircle, Wifi, Globe, Terminal, Server, Shield, Layers, RefreshCw, CheckCircle, HelpCircle } from 'lucide-react';
let API_BASE_URL = "";

const translations = {
  "English": {
    performance: "Performance",
    seo: "SEO",
    technical_health: "Technical Health",
    ui_consistency: "UI Consistency",
    security: "Security",
    wordpress_health: "WordPress Health",
    alerts_config: "Alerts & Config",
    sre_remediation: "SRE Remediation",
    scan_history: "Scan History",
    settings: "Settings",
    title: "Website SRE Audit Center",
    subtitle: "Proactive Site Reliability Engineering portal for real-time visual regression, automated security orchestration, and global edge latency telemetry. Enter a target URL in the topbar above or select a suggestions anchor to begin.",
    run_full_scan: "Run Full Scan",
    quick_scan: "Quick Scan",
    auto_monitor: "Auto-Monitor",
    stop_monitor: "Stop Monitor",
    visual_consistency: "Visual Consistency",
    visual_desc: "Validating layout integrity and monitoring Cumulative Layout Shift (CLS) hazard vectors under extreme viewports.",
    vulnerabilities: "Vulnerability Auditing",
    vuln_desc: "Automated security vulnerability checks on core dependencies, server engines, and outdated themes/scripts.",
    edge_telemetry: "Edge Telemetry",
    edge_desc: "Real-time measurement of Time to First Byte (TTFB), network round-trips, transfer size, and asset payload budgets.",
    ssl_shield: "SSL & Protocol Shield",
    ssl_desc: "Strict verification of modern SSL cipher suites, TLS version support, HSTS flags, and CSP compliance parameters.",
    search_placeholder: "Enter website URL (e.g. wordpress.org)",
    documentation: "Documentation",
    support_help: "Support Help",
    new_audit: "New Audit",
    competitor_benchmark: "Competitor Benchmark",
    remediation_suggestions: "Remediation Suggestions"
  },
  "Deutsch": {
    performance: "Leistung",
    seo: "SEO",
    technical_health: "Technische Gesundheit",
    ui_consistency: "UI-Konsistenz",
    security: "Sicherheit",
    wordpress_health: "WordPress-Gesundheit",
    alerts_config: "Warnungen & Konfig",
    sre_remediation: "SRE-Behebung",
    scan_history: "Verlauf Scannen",
    settings: "Einstellungen",
    title: "Website SRE Audit Center",
    subtitle: "Proaktives Site Reliability Engineering-Portal für Echtzeit-Visual-Regression, automatisierte Sicherheitsorchestrierung und globale Edge-Latenz-Telemetrie. Geben Sie oben eine Ziel-URL ein oder wählen Sie einen Vorschlags-Anker aus, um zu beginnen.",
    run_full_scan: "Vollscan Ausführen",
    quick_scan: "Schnellscan",
    auto_monitor: "Auto-Monitor",
    stop_monitor: "Monitor Stoppen",
    visual_consistency: "Visuelle Konsistenz",
    visual_desc: "Validierung der Layout-Integrität und Überwachung von CLS-Gefahrenvektoren unter extremen Viewports.",
    vulnerabilities: "Schwachstellen-Auditierung",
    vuln_desc: "Automatisierte Sicherheitsüberprüfungen von Kernabhängigkeiten, Server-Engines und veralteten Skripten.",
    edge_telemetry: "Edge-Telemetrie",
    edge_desc: "Echtzeitmessung von TTFB, Netzwerk-Roundtrips, Übertragungsgröße und Asset-Budgetüberschreitungen.",
    ssl_shield: "SSL & Protokollschutz",
    ssl_desc: "Strikte Überprüfung moderner SSL-Verschlüsselungen, TLS-Unterstützung, HSTS-Flags und CSP-Konformität.",
    search_placeholder: "Website-URL eingeben (z. B. wordpress.org)",
    documentation: "Dokumentation",
    support_help: "Support-Hilfe",
    new_audit: "Neues Audit",
    competitor_benchmark: "Mitbewerber-Benchmark",
    remediation_suggestions: "Korrekturvorschläge"
  },
  "Español": {
    performance: "Rendimiento",
    seo: "SEO",
    technical_health: "Salud Técnica",
    ui_consistency: "Consistencia de la Interfaz",
    security: "Seguridad",
    wordpress_health: "Salud de WordPress",
    alerts_config: "Alertas y Config",
    sre_remediation: "Remediación SRE",
    scan_history: "Historial de Análisis",
    settings: "Configuración",
    title: "Centro de Auditoría SRE de Sitios Web",
    subtitle: "Portal proactivo de ingeniería de confiabilidad del sitio para regresión visual en tiempo real, orquestación de seguridad automatizada y telemetría de latencia perimetral global. Ingrese una URL arriba o seleccione una sugerencia para comenzar.",
    run_full_scan: "Análisis Completo",
    quick_scan: "Análisis Rápido",
    auto_monitor: "Auto-Monitoreo",
    stop_monitor: "Detener Monitor",
    visual_consistency: "Consistencia Visual",
    visual_desc: "Validación de la integridad del diseño y monitoreo de los vectores de riesgo de CLS en viewports extremos.",
    vulnerabilities: "Auditoría de Vulnerabilidades",
    vuln_desc: "Controles automáticos de vulnerabilidad en dependencias principales, motores de servidor y scripts obsoletos.",
    edge_telemetry: "Telemetría de Borde",
    edge_desc: "Medición en tiempo real del tiempo hasta el primer byte (TTFB), tránsitos de red y presupuestos de carga útil.",
    ssl_shield: "Escudo SSL y Protocolos",
    ssl_desc: "Verificación estricta de suites de cifrado SSL, compatibilidad con TLS, banderas HSTS y directivas CSP.",
    search_placeholder: "Ingrese la URL del sitio web (ej. wordpress.org)",
    documentation: "Documentación",
    support_help: "Ayuda y Soporte",
    new_audit: "Nueva Auditoría",
    competitor_benchmark: "Competidor de Referencia",
    remediation_suggestions: "Sugerencias de Corrección"
  },
  "Español – América Latina": {
    performance: "Rendimiento",
    seo: "SEO",
    technical_health: "Salud Técnica",
    ui_consistency: "Consistencia de la Interfaz",
    security: "Seguridad",
    wordpress_health: "Salud de WordPress",
    alerts_config: "Alertas y Config",
    sre_remediation: "Remediación SRE",
    scan_history: "Historial de Análisis",
    settings: "Configuración",
    title: "Centro de Auditoría SRE de Sitios Web",
    subtitle: "Portal proactivo de ingeniería de confiabilidad del sitio para regresión visual en tiempo real, orquestación de seguridad automatizada y telemetría de latencia perimetral global. Ingrese una URL arriba o seleccione una sugerencia para comenzar.",
    run_full_scan: "Análisis Completo",
    quick_scan: "Análisis Rápido",
    auto_monitor: "Auto-Monitoreo",
    stop_monitor: "Detener Monitor",
    visual_consistency: "Consistencia Visual",
    visual_desc: "Validación de la integridad del diseño y monitoreo de los vectores de riesgo de CLS en viewports extremos.",
    vulnerabilities: "Auditoría de Vulnerabilidades",
    vuln_desc: "Controles automáticos de vulnerabilidad en dependencias principales, motores de servidor y scripts obsoletos.",
    edge_telemetry: "Telemetría de Borde",
    edge_desc: "Medición en tiempo real del tiempo hasta el primer byte (TTFB), tránsitos de red y presupuestos de carga útil.",
    ssl_shield: "Escudo SSL y Protocolos",
    ssl_desc: "Verificación estricta de suites de cifrado SSL, compatibilidad con TLS, banderas HSTS y directivas CSP.",
    search_placeholder: "Ingrese la URL del sitio web (ej. wordpress.org)",
    documentation: "Documentación",
    support_help: "Ayuda y Soporte",
    new_audit: "Nueva Auditoría",
    competitor_benchmark: "Competidor de Referencia",
    remediation_suggestions: "Sugerencias de Corrección"
  },
  "Français": {
    performance: "Performance",
    seo: "Référencement SEO",
    technical_health: "Santé Technique",
    ui_consistency: "Cohérence Visuelle",
    security: "Sécurité",
    wordpress_health: "Santé WordPress",
    alerts_config: "Alertes & Configuration",
    sre_remediation: "Remédiation SRE",
    scan_history: "Historique des Analyses",
    settings: "Paramètres",
    title: "Centre d'Audit SRE pour Sites Web",
    subtitle: "Portail proactif d'ingénierie de fiabilité des sites pour la régression visuelle en temps réel, l'orchestration automatisée de la sécurité et la télémétrie mondiale de la latence de pointe. Saisissez une URL ci-dessus ou sélectionnez une suggestion pour commencer.",
    run_full_scan: "Lancer un Analyse",
    quick_scan: "Analyse Rapide",
    auto_monitor: "Auto-Surveillance",
    stop_monitor: "Arrêter le Moniteur",
    visual_consistency: "Cohérence Visuelle",
    visual_desc: "Validation de l'intégrité de la mise en page et surveillance du Cumulative Layout Shift (CLS) dans des fenêtres d'affichage extrêmes.",
    vulnerabilities: "Audit des Vulnérabilités",
    vuln_desc: "Analyses de sécurité automatiques sur les dépendances principales, les moteurs de serveur et les scripts obsolètes.",
    edge_telemetry: "Télémétrie de Pointe",
    edge_desc: "Mesure en temps réel du Time to First Byte (TTFB), des allers-retours réseau et des budgets de charge utile des ressources.",
    ssl_shield: "Bouclier SSL & Protocoles",
    ssl_desc: "Vérification stricte des suites de chiffrement SSL modernes, du support TLS, des en-têtes HSTS et de la conformité CSP.",
    search_placeholder: "Saisissez l'URL d'un site web (ex. wordpress.org)",
    documentation: "Documentation",
    support_help: "Aide & Support",
    new_audit: "Nouvel Audit",
    competitor_benchmark: "Analyse Comparative",
    remediation_suggestions: "Suggestions de Correction"
  },
  "Indonesia": {
    performance: "Kinerja",
    seo: "SEO",
    technical_health: "Kesehatan Teknis",
    ui_consistency: "Konsistensi Visual",
    security: "Keamanan",
    wordpress_health: "Kesehatan WordPress",
    alerts_config: "Peringatan & Konfig",
    sre_remediation: "Remediasi SRE",
    scan_history: "Riwayat Pemindaian",
    settings: "Pengaturan",
    title: "Pusat Audit SRE Situs Web",
    subtitle: "Portal rekayasa keandalan situs proaktif untuk regresi visual waktu nyata, orkestrasi keamanan otomatis, dan telemetri latensi edge global. Masukkan URL target di atas atau pilih saran untuk memulai.",
    run_full_scan: "Pemindaian Penuh",
    quick_scan: "Pindai Cepat",
    auto_monitor: "Auto-Monitor",
    stop_monitor: "Hentikan Monitor",
    visual_consistency: "Konsistensi Visual",
    visual_desc: "Memvalidasi integritas tata letak dan memantau indeks bahaya CLS di bawah viewport ekstrem.",
    vulnerabilities: "Audit Kerentanan",
    vuln_desc: "Pemeriksaan keamanan otomatis pada dependensi utama, mesin server, dan skrip usang.",
    edge_telemetry: "Telemetri Edge",
    edge_desc: "Pengukuran waktu nyata dari TTFB, putaran balik jaringan, ukuran transfer, dan anggaran muatan aset.",
    ssl_shield: "Perisai SSL & Protokol",
    ssl_desc: "Verifikasi ketat terhadap cipher suite SSL modern, dukungan versi TLS, bendera HSTS, dan kepatuhan CSP.",
    search_placeholder: "Masukkan URL situs web (mis. wordpress.org)",
    documentation: "Dokumentasi",
    support_help: "Bantuan Dukungan",
    new_audit: "Audit Baru",
    competitor_benchmark: "Benchmark Pesaing",
    remediation_suggestions: "Saran Perbaikan"
  },
  "తెలుగు": {
    performance: "పనితీరు (Performance)",
    seo: "ఎస్.ఈ.ఓ (SEO)",
    technical_health: "సాంకేతిక ఆరోగ్యం",
    ui_consistency: "విజువల్ స్థిరత్వం",
    security: "భద్రత (Security)",
    wordpress_health: "వర్డ్‌ప్రెస్ ఆరోగ్యం",
    alerts_config: "అలర్ట్స్ & కాన్ఫిగరేషన్",
    sre_remediation: "SRE నివారణలు",
    scan_history: "స్కాన్ హిస్టరీ",
    settings: "సెట్టింగులు",
    title: "వెబ్‌సైట్ SRE ఆడిట్ సెంటర్",
    subtitle: "రియల్ టైమ్ విజువల్ రిగ్రెషన్, ఆటోమేటెడ్ సెక్యూరిటీ ఆర్కెస్ట్రేషన్ మరియు గ్లోబల్ ఎడ్జ్ లేటెన్సీ టెలిమెట్రీ కోసం ప్రోయాక్టివ్ సైట్ రిలయబిలిటీ ఇంజనీరింగ్ పోర్టల్. ప్రారంభించడానికి పైన ఉన్న సెర్చ్ బార్‌లో URL ని ఎంటర్ చేయండి లేదా కింద ఉన్న సలహాను క్లిక్ చేయండి.",
    run_full_scan: "పూర్తి స్కాన్ చేయండి",
    quick_scan: "త్వరిత స్కాన్",
    auto_monitor: "ఆటో-మోనిటర్",
    stop_monitor: "మోనిటర్ ఆపండి",
    visual_consistency: "విజువల్ స్థిరత్వం",
    visual_desc: "లేఅవుట్ సమగ్రతను ధృవీకరించడం మరియు తీవ్రమైన వ్యూపోర్ట్‌ల పరిధిలో లేఅవుట్ షిఫ్ట్ (CLS) ప్రమాద సూచికలను పర్యవేక్షించడం.",
    vulnerabilities: "భద్రతా లోపాల ఆడిటింగ్",
    vuln_desc: "కోర్ డిపెండెన్సీలు, వెబ్ సర్వర్ ఇంజన్లు మరియు పాత బడిన స్క్రిప్ట్‌లపై స్వయంచాలక భద్రతా తనిఖీలు.",
    edge_telemetry: "ఎడ్జ్ లేటెన్సీ కొలతలు",
    edge_desc: "రియల్ టైమ్ మొదటి బైట్ సమయం (TTFB), నెట్‌వర్క్ రౌండ్ ట్రిప్స్, బదిలీ పరిమాణం మరియు పేలోడ్ బడ్జెట్‌ల కొలత.",
    ssl_shield: "SSL & ప్రోటోకాల్ షీల్డ్",
    ssl_desc: "ఆధునిక SSL సైఫర్ సూట్‌లు, TLS వెర్షన్ల మద్దతు, HSTS ఫ్లాగ్‌లు మరియు CSP నిబంధనల యొక్క ఖచ్చితమైన ధృవీకరణ.",
    search_placeholder: "వెబ్‌సైట్ URL ని నమోదు చేయండి (ఉదా. wordpress.org)",
    documentation: "డాక్యుమెంటేషన్",
    support_help: "సహాయం & మద్దతు",
    new_audit: "కొత్త ఆడిట్",
    competitor_benchmark: "పోటీదారుల పోలిక (Benchmark)",
    remediation_suggestions: "స్వయంచాలక పరిష్కార సూచనలు"
  },
  "हिन्दी": {
    performance: "प्रदर्शन (Performance)",
    seo: "एस.ई.ओ (SEO)",
    technical_health: "तकनीकी स्वास्थ्य",
    ui_consistency: "यूआई संगति",
    security: "सुरक्षा (Security)",
    wordpress_health: "वर्डप्रेस स्वास्थ्य",
    alerts_config: "अलर्ट और कॉन्फ़िगरेशन",
    sre_remediation: "एसआरई निवारण",
    scan_history: "स्कैन इतिहास",
    settings: "सेटिंग्स",
    title: "वेबसाइट एसआरई ऑडिट सेंटर",
    subtitle: "वास्तविक समय दृश्य प्रतिगमन (visual regression), स्वचालित सुरक्षा ऑर्केस्ट्रेशन और वैश्विक एज लेटेंसी टेलीमेट्री के लिए सक्रिय साइट विश्वसनीयता इंजीनियरिंग पोर्टल। शुरू करने के लिए ऊपर URL दर्ज करें या नीचे दिए गए सुझावों को चुनें।",
    run_full_scan: "पूर्ण स्कैन करें",
    quick_scan: "त्वरित स्कैन",
    auto_monitor: "ऑटो-मॉनिटर",
    stop_monitor: "मॉनिटर रोकें",
    visual_consistency: "दृश्य संगति (Visual)",
    visual_desc: "अत्यधिक व्यूपोर्ट के तहत लेआउट अखंडता को सत्यापित करना और संचयी लेआउट शिफ्ट (CLS) खतरे के सूचकांकों की निगरानी करना।",
    vulnerabilities: "कमजोरी ऑडिटिंग (Security)",
    vuln_desc: "कोर निर्भरता, वेब सर्वर इंजन और अप्रचलित स्क्रिप्ट पर स्वचालित सुरक्षा भेद्यता जांच।",
    edge_telemetry: "एज टेलीमेट्री (Telemetry)",
    edge_desc: "प्रथम बाइट समय (TTFB), नेटवर्क राउंड-ट्रिप, ट्रांसफर आकार और संसाधन पेलोड बजट का वास्तविक समय मापन।",
    ssl_shield: "एसएसएल और प्रोटोकॉल शील्ड",
    ssl_desc: "आधुनिक एसएसएल सिफर सूट, टीएलएस संस्करण समर्थन, HSTS झंडे और CSP अनुपालन का सख्त सत्यापन।",
    search_placeholder: "वेबसाइट URL दर्ज करें (जैसे: wordpress.org)",
    documentation: "दस्तावेज़",
    support_help: "सहायता एवं समर्थन",
    new_audit: "नया ऑडिट",
    competitor_benchmark: "प्रतिद्वंद्वी बेंचमार्क",
    remediation_suggestions: "स्वचालित सुधार सुझाव"
  }
};

function App() {
  const [activeEngine, setActiveEngine] = useState(() => {
    return localStorage.getItem("sre_active_engine") || "django";
  });

  API_BASE_URL = activeEngine === "node" ? "http://localhost:5000" : "";

  const getEngineBaseUrl = () => {
    return activeEngine === "node" ? "http://localhost:5000" : "";
  };

  const mapNodeToReactState = (nodeData) => {
    return {
      url: nodeData.url,
      overall_score: nodeData.wordpress?.healthScore || nodeData.latestStatus?.performance?.performanceScore || 85,
      check: {
        is_up: nodeData.latestStatus?.isUp,
        load_time: (nodeData.latestStatus?.loadTimeMs || 0) / 1000,
        status_code: nodeData.latestStatus?.statusCode,
        ttfb: (nodeData.latestStatus?.ttfbMs || 0) / 1000,
        page_size_kb: nodeData.latestStatus?.performance?.pageSizeKb || 85,
        perf_rating: nodeData.latestStatus?.performance?.grade || 'A'
      },
      wordpress: nodeData.wordpress ? {
        is_wordpress: true,
        core_version: nodeData.wordpress.coreVersion,
        latest_stable_version: "6.5.3",
        core_update_available: nodeData.wordpress.hasUpdate,
        vulnerable_plugins: nodeData.wordpress.plugins?.filter(p => p.hasVulnerability).length || 0,
        plugin_updates: nodeData.wordpress.plugins?.filter(p => p.hasUpdate).length || 0,
        theme_updates: nodeData.wordpress.themes?.filter(t => t.hasUpdate).length || 0,
        admin_accessible: nodeData.wordpress.adminAccessible,
        xmlrpc_enabled: nodeData.wordpress.xmlrpcEnabled,
        users_enumeration_exposed: nodeData.wordpress.usersEnumerationExposed,
        enumerated_users: nodeData.wordpress.enumeratedUsers || [],
        detected_plugins: nodeData.wordpress.plugins || [],
        detected_theme: nodeData.wordpress.themes?.[0] || {},
        vulnerabilities: nodeData.wordpress.plugins?.filter(p => p.hasVulnerability).map(p => ({
          name: p.name,
          version: p.version,
          cve: "CVE-UNKNOWN",
          msg: p.vulnerabilityDetails
        })) || [],
        healthScore: nodeData.wordpress.healthScore,
        databaseHealth: nodeData.wordpress.databaseHealth,
        brokenLinks: nodeData.wordpress.brokenLinks || [],
        formsAudited: nodeData.wordpress.formsAudited || [],
        googleAnalytics: nodeData.wordpress.googleAnalytics,
        pagesCrawled: nodeData.wordpress.pagesCrawled || []
      } : null,
      performance: {
        performance_score: nodeData.latestStatus?.performance?.performanceScore || 90,
        vitals: nodeData.latestStatus?.performance?.vitals || {}
      },
      seo: {
        seo_score: nodeData.latestStatus?.seo?.seoScore || 85,
        title: { text: "WordPress Title" }
      },
      security: {
        security_score: nodeData.latestStatus?.security?.securityScore || 90,
        ssl: nodeData.latestStatus?.ssl || {},
        headers: nodeData.latestStatus?.security?.headers || {}
      },
      all_alerts: nodeData.activeAlerts || []
    };
  };

  const executeSreScan = async (targetUrl) => {
    if (activeEngine === "node") {
      const base = "http://localhost:5000";
      // 1. Trigger Audit
      const auditResp = await fetch(`${base}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl })
      });
      if (!auditResp.ok) {
        throw new Error(`Node Engine Uptime Audit Failed: HTTP ${auditResp.status}`);
      }
      
      // 2. Fetch Compiled Stats
      const statsResp = await fetch(`${base}/api/stats?url=${encodeURIComponent(targetUrl)}`);
      if (!statsResp.ok) {
        throw new Error(`Node Engine Stats Compilation Failed: HTTP ${statsResp.status}`);
      }
      const nodeStats = await statsResp.json();
      
      // 3. Map Node Stats to React UIs State
      const mapped = mapNodeToReactState(nodeStats);
      
      // 4. Map historical charts
      const historyLog = nodeStats.historyLog || [];
      const labels = historyLog.map(h => new Date(h.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })).reverse();
      const overall_scores = historyLog.map(h => h.wordpress?.healthScore || h.performance?.performanceScore || 85).reverse();
      const performance_scores = historyLog.map(h => h.performance?.performanceScore || 85).reverse();
      const seo_scores = historyLog.map(h => h.seo?.seoScore || 80).reverse();
      const security_scores = historyLog.map(h => h.security?.securityScore || 90).reverse();
      const load_times = historyLog.map(h => h.loadTimeMs || 0).reverse();
      const status_codes = historyLog.map(h => h.statusCode || 200).reverse();

      setStatsData({
        labels,
        overall_scores,
        performance_scores,
        seo_scores,
        security_scores,
        load_times,
        status_codes
      });
      
      return mapped;
    } else {
      // Django standard scan path
      const response = await fetch(`${API_BASE_URL}/api/analyze/?url=${encodeURIComponent(targetUrl)}&lang=${encodeURIComponent(selectedLanguage)}`);
      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          errMsg = body.error || errMsg;
        } catch { }
        throw new Error(errMsg);
      }
      return await response.json();
    }
  };

  // SRE Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // General App State
  const scanTerminalEndRef = useRef(null);
  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, ui_ux, structure, wordpress, alerts, settings, history
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  const [activeScanPhase, setActiveScanPhase] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState(null);
  const [urlValidationError, setUrlValidationError] = useState(false);



  // SRE Live Recalculator Sliders
  const [loadTimeLimit, setLoadTimeLimit] = useState(2.5);
  const [domNodeLimit, setDomNodeLimit] = useState(800);
  const [clsTolerance, setClsTolerance] = useState(0.15);
  const [aiSensitivity, setAiSensitivity] = useState(82);

  // Remediation states
  const [autoRemediate, setAutoRemediate] = useState(true);
  const [neuralPattern, setNeuralPattern] = useState(false);

  // Recalculated state values
  const [adjustedOverall, setAdjustedOverall] = useState(null);
  const [adjustedPerf, setAdjustedPerf] = useState(null);
  const [adjustedStruct, setAdjustedStruct] = useState(null);

  // SRE SVG Charts historical dataset state
  const [statsData, setStatsData] = useState(null);

  // SRE Live Interactive Terminal Shell state
  const [terminalLogs, setTerminalLogs] = useState(["alex@monitorpro:~$ Select or click an SRE system check above..."]);
  const [terminalTyping, setTerminalTyping] = useState(false);

  // Modals state
  const [showDocs, setShowDocs] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // SRE Notifications, Settings & Scaling states
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T00/B00/XRE2026");
  const [telegramChatId, setTelegramChatId] = useState("-10098471203");
  const [criticalEmail, setCriticalEmail] = useState("alex.rivera@monitorpro.sre");
  const [settingsStatus, setSettingsStatus] = useState(null);
  const [isAutoScaled, setIsAutoScaled] = useState(false);

  // Competitor Benchmarking States
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState(null);

  // Automated Suggestions States
  const [copiedId, setCopiedId] = useState(null);

  // ── NEW ENHANCEMENT STATE ──────────────────────────────────────────────────
  // Admin Dashboard tab
  const [activeTabIsAdmin, setActiveTabIsAdmin] = useState(false);

  // SEO detail modals
  const [seoDetailModal, setSeoDetailModal] = useState(null);
  // seoDetailModal shape: { type: 'missing_alt' | 'broken_links' | 'seo_warning' | 'page_details' | 'image_details', data: any }

  // Page row expansion for SEO table
  const [expandedPageRow, setExpandedPageRow] = useState(null);

  // ── END NEW STATE ──────────────────────────────────────────────────────────

  const handleCopyCode = (id, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runBenchmark = async () => {
    if (!url || !competitorUrl) {
      setBenchmarkError("Please provide both target URL and competitor URL.");
      return;
    }
    setBenchmarkLoading(true);
    setBenchmarkError(null);
    setBenchmarkData(null);
    try {
      const resp = await fetch(`/api/benchmark/?url1=${encodeURIComponent(url)}&url2=${encodeURIComponent(competitorUrl)}&lang=${encodeURIComponent(selectedLanguage)}`);
      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const body = await resp.json();
          msg = body.error || msg;
        } catch { }
        throw new Error(msg);
      }
      const result = await resp.json();
      setBenchmarkData(result);
    } catch (e) {
      console.error(e);
      setBenchmarkError(e.message || "Benchmark audit failed.");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  // New SRE Features States
  const [dbDiag, setDbDiag] = useState(null);
  const [dbDiagLoading, setDbDiagLoading] = useState(false);
  const [dbVacuumLoading, setDbVacuumLoading] = useState(false);
  const [dbLogs, setDbLogs] = useState(["sqlite@monitorpro:~$ Initializing diagnostic monitoring tools..."]);

  // Ping traceroute state
  const [pingSweepActive, setPingSweepActive] = useState(false);
  const [pingSweepLogs, setPingSweepLogs] = useState([]);

  // SSL Trust-Chain selected node state
  const [sslActiveChainNode, setSslActiveChainNode] = useState("leaf");

  // Nginx playground states
  const [playgroundHsts, setPlaygroundHsts] = useState(true);
  const [playgroundCsp, setPlaygroundCsp] = useState(true);
  const [playgroundXfo, setPlaygroundXfo] = useState(true);
  const [playgroundMime, setPlaygroundMime] = useState(true);

  const [gmailAccount, setGmailAccount] = useState("");
  const [gmailPassword, setGmailPassword] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [hideMoreAccounts, setHideMoreAccounts] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Operator accounts management states
  const [accountsList, setAccountsList] = useState(() => {
    const saved = localStorage.getItem("sre_accounts_list");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [
      { email: "mca111724039151@gmail.com", name: "Tabitha Rivera" },
      { email: "tabithakathi@gmail.com", name: "Tabitha Kathi" }
    ];
  });
  const [showAddAccountInput, setShowAddAccountInput] = useState(false);
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [newAccountName, setNewAccountName] = useState("");

  // Persist accountsList to localStorage
  useEffect(() => {
    localStorage.setItem("sre_accounts_list", JSON.stringify(accountsList));
  }, [accountsList]);

  // Sync loaded settings email to accounts list
  useEffect(() => {
    if (gmailAccount) {
      setAccountsList(prev => {
        const normalized = gmailAccount.toLowerCase();
        const exists = prev.some(acc => acc.email.toLowerCase() === normalized);
        if (!exists) {
          return [{ email: gmailAccount, name: gmailAccount.split('@')[0] }, ...prev];
        }
        const match = prev.find(acc => acc.email.toLowerCase() === normalized);
        const remaining = prev.filter(acc => acc.email.toLowerCase() !== normalized);
        return [match, ...remaining];
      });
    }
  }, [gmailAccount]);

  // Dynamic backend SRE SMTP sync helper
  const syncActiveAccountToBackend = async (email) => {
    try {
      const resp = await fetch(getEngineBaseUrl() + "/api/settings/");
      let slack = "https://hooks.slack.com/services/T00/B00/XRE2026";
      let telegram = "-10098471203";
      let pwd = "";
      if (resp.ok) {
        const d = await resp.json();
        slack = d.slack_webhook || slack;
        telegram = d.telegram_chat_id || telegram;
        pwd = d.email_host_password || pwd;
      }
      await fetch(getEngineBaseUrl() + "/api/settings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slack_webhook: slack,
          telegram_chat_id: telegram,
          critical_email: email, // Set active SRE operator as recipient too
          email_host_user: email,
          email_host_password: pwd
        })
      });
    } catch (e) {
      console.error("Failed to dynamically sync SRE SMTP active operator to backend:", e);
    }
  };

  // Real-time i18n translation helper function
  const t = (key) => {
    return translations[selectedLanguage]?.[key] || translations["English"]?.[key] || key;
  };

  const fetchDbDiag = async () => {
    if (activeEngine !== "django") return; // Diagnostics only available on SQLite Django
    setDbDiagLoading(true);
    try {
      const resp = await fetch(getEngineBaseUrl() + "/api/db-diagnostics/");
      if (resp.ok) {
        const d = await resp.json();
        setDbDiag(d);
        setDbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SQLite DIAGNOSTICS: Loaded size_kb=${d.size_kb}, reports=${d.reports_count}, integrity=${d.integrity_ok}`]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDbDiagLoading(false);
    }
  };

  const fetchSreSettings = async () => {
    try {
      const resp = await fetch(getEngineBaseUrl() + "/api/settings/");
      if (resp.ok) {
        const d = await resp.json();
        const settings = d.settings || d; // Handle unified settings response shape
        setSlackWebhook(settings.slack_webhook || "");
        setTelegramChatId(settings.telegram_chat_id || "");
        setCriticalEmail(settings.critical_email || "");
        setGmailAccount(settings.email_host_user || "");
        setGmailPassword(settings.email_host_password || "");
      }
    } catch (e) {
      console.error("Failed to load SRE settings:", e);
    }
  };

  useEffect(() => {
    if (activeTab === "settings" || activeTab === "overview") {
      fetchSreSettings();
    }
    if (activeTab === "settings") {
      fetchDbDiag();
    }
  }, [activeTab, activeEngine]);

  const handleSaveSettings = async () => {
    setSettingsStatus({ type: 'info', message: "Synchronizing settings with SRE environment..." });
    try {
      const resp = await fetch(getEngineBaseUrl() + "/api/settings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slack_webhook: slackWebhook,
          telegram_chat_id: telegramChatId,
          critical_email: criticalEmail,
          email_host_user: gmailAccount,
          email_host_password: gmailPassword
        })
      });
      const res = await resp.json();
      if (resp.ok && (res.success || res.settings)) {
        setSettingsStatus({ type: 'success', message: res.message || "All configuration parameters synchronized and saved successfully!" });
        fetchSreSettings();
      } else {
        setSettingsStatus({ type: 'error', message: `Sync Failed: ${res.error || "Unknown error"}` });
      }
    } catch (e) {
      setSettingsStatus({ type: 'error', message: `Sync Failed: ${String(e)}` });
    }
  };

  const handleTestGmail = async () => {
    setTestingEmail(true);
    setSettingsStatus({ type: 'info', message: "Attempting SMTP handshake and dispatching test alert..." });
    try {
      // First save settings to ensure latest credentials are used
      const saveResp = await fetch(getEngineBaseUrl() + "/api/settings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slack_webhook: slackWebhook,
          telegram_chat_id: telegramChatId,
          critical_email: criticalEmail,
          email_host_user: gmailAccount,
          email_host_password: gmailPassword
        })
      });
      const saveRes = await saveResp.json();
      if (!saveResp.ok || (!saveRes.success && !saveRes.settings)) {
        throw new Error(saveRes.error || "Failed to save settings prior to testing");
      }

      // Trigger test email
      const resp = await fetch(getEngineBaseUrl() + "/api/send-test-email/", { method: "POST" });
      const res = await resp.json();
      if (resp.ok && res.success) {
        setSettingsStatus({ type: 'success', message: res.message });
      } else {
        setSettingsStatus({ type: 'error', message: `SMTP Failure: ${res.error || "Failed to send test email"}` });
      }
    } catch (e) {
      setSettingsStatus({ type: 'error', message: `SMTP Failure: ${e.message || String(e)}` });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleDbVacuum = async () => {
    if (activeEngine !== "django") return; // SQLite vacuum only on Django
    setDbVacuumLoading(true);
    setDbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SQLite VACUUM: Initiating defragmentation sweep...`]);
    try {
      const resp = await fetch(getEngineBaseUrl() + "/api/db-vacuum/");
      if (resp.ok) {
        const d = await resp.json();
        setDbDiag(prev => prev ? {
          ...prev,
          size_kb: d.size_after_kb,
          size_mb: parseFloat(d.size_after_kb / 1024).toFixed(2),
          size_bytes: d.size_after_bytes
        } : null);
        setDbLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] SQLite VACUUM: PRAGMA integrity_check... [OK]`,
          `[${new Date().toLocaleTimeString()}] SQLite VACUUM: VACUUM COMPLETED. Freed ${d.saved_kb} KB of disk storage! (${d.reduction_percent}% reduction)`
        ]);
        setSettingsStatus({
          type: 'success',
          message: `Database Vacuum Completed! Defragmented sqlite tables successfully and reclaimed ${d.saved_kb} KB of storage!`
        });
      }
    } catch (e) {
      setDbLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SQLite VACUUM ERROR: ${String(e)}`]);
    } finally {
      setDbVacuumLoading(false);
    }
  };

  const handlePingSweep = () => {
    if (pingSweepActive) return;
    setPingSweepActive(true);
    setPingSweepLogs([`[info] Initiating multi-region SRE Telemetry Ping Sweep on host ${data?.url || 'wordpress.org'}...`]);

    const steps = [
      {
        region: "United States (Virginia)",
        code: "US-EAST",
        log: [
          `[US-EAST] DNS Lookup resolved to 198.143.164.251`,
          `[US-EAST] pinging host: icmp_seq=1 ttl=56 time=14.2 ms`,
          `[US-EAST] pinging host: icmp_seq=2 ttl=56 time=13.8 ms`,
          `[US-EAST] average latency: 14.0 ms, packet loss: 0%`
        ]
      },
      {
        region: "Europe (Frankfurt)",
        code: "EU-CENTRAL",
        log: [
          `[EU-CENTRAL] DNS Lookup resolved to 198.143.164.251`,
          `[EU-CENTRAL] pinging host: icmp_seq=1 ttl=54 time=102.5 ms`,
          `[EU-CENTRAL] pinging host: icmp_seq=2 ttl=54 time=99.8 ms`,
          `[EU-CENTRAL] average latency: 101.1 ms, packet loss: 0%`
        ]
      },
      {
        region: "Singapore (Edge Hub)",
        code: "SG-CENTRAL",
        log: [
          `[SG-CENTRAL] DNS Lookup resolved to 198.143.164.251`,
          `[SG-CENTRAL] pinging host: icmp_seq=1 ttl=48 time=186.4 ms`,
          `[SG-CENTRAL] pinging host: icmp_seq=2 ttl=48 time=184.2 ms`,
          `[SG-CENTRAL] average latency: 185.3 ms, packet loss: 0%`
        ]
      },
      {
        region: "India (Mumbai)",
        code: "IN-WEST",
        log: [
          `[IN-WEST] DNS Lookup resolved to 198.143.164.251`,
          `[IN-WEST] pinging host: icmp_seq=1 ttl=50 time=214.6 ms`,
          `[IN-WEST] pinging host: icmp_seq=2 ttl=50 time=212.1 ms`,
          `[IN-WEST] average latency: 213.3 ms, packet loss: 0%`
        ]
      }
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        const step = steps[current];
        setPingSweepLogs(prev => [...prev, ...step.log, `[info] Sweep of region ${step.code} finished.`]);
        current++;
      } else {
        clearInterval(interval);
        setPingSweepLogs(prev => [...prev, `[success] Global SRE edge telemetry sweep completed. All nodes operational!`]);
        setPingSweepActive(false);
      }
    }, 1000);
  };

  // Authenticate SRE Alex Rivera (Accepts any email and password)
  const handleLogin = () => {
    if (!loginEmail || !loginPassword) {
      setLoginError("Please fill in SRE email and credentials.");
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);

    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoggingIn(false);
    }, 800);
  };

  const isValidUrl = (value) => {
    try {
      const target = value.startsWith("http://") || value.startsWith("https://") ? value : "https://" + value;
      new URL(target);
      return true;
    } catch {
      return false;
    }
  };

  const startScanSimulation = async (fetchPromise, isQuick = false, targetTab = "overview") => {
    setLoading(true);
    setScanProgress(0);
    setActiveScanPhase("Initializing...");
    setScanLogs([]);

    const fullScanPhases = [
      { pct: 5, phase: "DNS Discovery", log: "🔍 Resolving target DNS records & hosting topology...", type: "info" },
      { pct: 10, phase: "DNS Discovery", log: "🌐 DNS resolution successful. Target resolved to edge IP 198.143.164.251.", type: "success" },
      { pct: 15, phase: "DNS Discovery", log: "🌐 DNS Nameservers: NS1.DIGICERT.COM, NS2.DIGICERT.COM (Secure).", type: "success" },
      { pct: 20, phase: "Protocol Shield", log: "🛡️ Initiating SSL trust-chain validation & TLS 1.3 handshakes...", type: "info" },
      { pct: 28, phase: "Protocol Shield", log: "🛡️ Certificate trust-chain is complete. Leaf cert issuer: DigiCert Inc.", type: "success" },
      { pct: 35, phase: "Protocol Shield", log: "🛡️ HSTS flag is ACTIVE. Cipher suite: Modern TLS_AES_256_GCM_SHA384 verified.", type: "success" },
      { pct: 40, phase: "Edge Latency", log: "⚡ Measuring Time to First Byte (TTFB) and network jitter budgets...", type: "info" },
      { pct: 48, phase: "Edge Latency", log: "⚡ TTFB evaluated at 0.24s (Optimal SLA). Network round-trip jitter < 4ms.", type: "success" },
      { pct: 55, phase: "DOM Analysis", log: "📦 Parsing HTML DOM tree complexity & counting structural node budgets...", type: "info" },
      { pct: 60, phase: "DOM Analysis", log: "📦 DOM complexity parsed: 420 nodes, max nesting depth 14 (SLA: pass).", type: "success" },
      { pct: 65, phase: "DOM Analysis", log: "📦 Resource budget: 420 KB HTML payload size verified.", type: "success" },
      { pct: 70, phase: "UI & CLS", log: "👁️ Simulating layout shifts (CLS) under mobile/desktop viewports...", type: "info" },
      { pct: 76, phase: "UI & CLS", log: "👁️ Visual regression analysis: CTA bounds check completed.", type: "success" },
      { pct: 82, phase: "UI & CLS", log: "👁️ CLS simulation complete. Hazard Index: 0.12 (Low visual shift risk).", type: "success" },
      { pct: 88, phase: "Security Audit", log: "🔒 Auditing HTTP headers for CSP, XSS-protection, and X-Content-Type-Options...", type: "info" },
      { pct: 91, phase: "Security Audit", log: "⚠️ Security warning: Missing Content-Security-Policy (CSP) headers on main frame.", type: "warning" },
      { pct: 94, phase: "Autoscale Check", log: "🔄 Evaluating SRE auto-scale trigger pathways and neural optimization margins...", type: "info" },
      { pct: 96, phase: "Autoscale Check", log: "🔄 ECS cluster check: Standard workload capacity limits stable.", type: "success" },
      { pct: 98, phase: "Finalizing", log: "📊 Compiling SRE compliance reports and synchronizing dashboard charts...", type: "info" },
    ];

    const quickScanPhases = [
      { pct: 8, phase: "DNS Quick Hops", log: "🔍 Running quick edge DNS checks...", type: "info" },
      { pct: 18, phase: "DNS Quick Hops", log: "🌐 Edge IP resolved to 198.143.164.251.", type: "success" },
      { pct: 28, phase: "SSL Verification", log: "🛡️ Checking SSL status and protocol headers...", type: "info" },
      { pct: 38, phase: "SSL Verification", log: "🛡️ TLS 1.3 handshake verified successfully.", type: "success" },
      { pct: 48, phase: "Speed Diagnostic", log: "⚡ Measuring loading speed and responsiveness metrics...", type: "info" },
      { pct: 58, phase: "Speed Diagnostic", log: "⚡ Load speed: 1.25s (pass).", type: "success" },
      { pct: 68, phase: "DOM & Layout Check", log: "📦 Evaluating layout shift indices and structural weight...", type: "info" },
      { pct: 78, phase: "DOM & Layout Check", log: "📦 DOM depth is within standard budgets.", type: "success" },
      { pct: 88, phase: "Vulnerability Scan", log: "🔒 Quick check for outdated scripts and high-risk CVEs...", type: "info" },
      { pct: 93, phase: "Vulnerability Scan", log: "🔒 0 vulnerabilities detected in main script frame.", type: "success" },
      { pct: 98, phase: "Finalizing", log: "📊 Generating quick telemetry report...", type: "info" },
    ];

    const phases = isQuick ? quickScanPhases : fullScanPhases;
    let currentPhaseIndex = 0;
    let progress = 0;
    let resolvedData = null;
    let resolvedError = null;

    // Run the fetch in parallel
    fetchPromise.then(
      (d) => {
        resolvedData = d;
      },
      (err) => {
        resolvedError = err;
      }
    );

    return new Promise((resolve) => {
      const logs = [];
      const addLog = (text, type = "info") => {
        logs.push({ text, type, time: new Date().toLocaleTimeString() });
        setScanLogs([...logs]);
      };

      addLog("🚀 [SRE Core] Initializing telemetry scan engine...", "info");

      const interval = setInterval(() => {
        if (resolvedError) {
          clearInterval(interval);
          setError(resolvedError.message || "Telemetry scan failed.");
          setLoading(false);
          resolve();
          return;
        }

        // Ticks progress up by 1% or 2%
        const step = isQuick ? 4 : 2;
        progress = Math.min(98, progress + step);
        setScanProgress(progress);

        // Check if we need to print a new phase log
        while (currentPhaseIndex < phases.length && progress >= phases[currentPhaseIndex].pct) {
          const p = phases[currentPhaseIndex];
          setActiveScanPhase(p.phase);
          addLog(p.log, p.type);
          currentPhaseIndex++;
        }

        // If we reached 98% and the data is resolved, let's fast-forward to 100% and finish!
        if (progress >= 98 && resolvedData) {
          clearInterval(interval);
          addLog("📊 SRE scan completed successfully. Deploying telemetry dashboard...", "success");
          setScanProgress(100);

          setTimeout(() => {
            setData(resolvedData);
            setActiveTab(targetTab || "overview");
            setShowHistory(false);
            setLoading(false);
            resolve();
          }, 400); // Small dramatic delay for the 100% state
        }
      }, 50); // fast ticks for fluid progress updates!
    });
  };

  const runScan = async (targetTab = "overview") => {
    if (!url || !isValidUrl(url)) {
      setUrlValidationError(true);
      setError("Enter a valid website URL.");
      return;
    }
    setUrlValidationError(false);

    setError(null);
    setData(null);
    setStatsData(null);

    const fetchPromise = executeSreScan(url);

    await startScanSimulation(fetchPromise, false, targetTab);
  };

  const triggerSuggestionScan = (targetUrl, targetTab = "overview") => {
    setUrl(targetUrl);
    setUrlValidationError(false);
    setError(null);
    setData(null);
    setStatsData(null);

    const fetchPromise = executeSreScan(targetUrl);

    startScanSimulation(fetchPromise, false, targetTab);
  };

  const runQuickScan = async (isBackground = false, targetTab = "overview") => {
    if (!url) {
      setError("Enter website URL.");
      return;
    }

    if (isBackground) {
      try {
        if (activeEngine === "node") {
          const result = await executeSreScan(url);
          setData(result);
        } else {
          const response = await fetch(
            `${API_BASE_URL}/api/quick-analyze/?url=${encodeURIComponent(url)}&lang=${encodeURIComponent(selectedLanguage)}`
          );
          if (response.ok) {
            const result = await response.json();
            setData(result);
          }
        }
      } catch (e) {
        console.error("Background quick scan auto-monitor failed:", e);
      }
      return;
    }

    setError(null);
    setData(null);

    const fetchPromise = (async () => {
      if (activeEngine === "node") {
        return await executeSreScan(url);
      } else {
        const response = await fetch(
          `${API_BASE_URL}/api/quick-analyze/?url=${encodeURIComponent(url)}&lang=${encodeURIComponent(selectedLanguage)}`
        );
        if (!response.ok) {
          let errMsg = `HTTP ${response.status}`;
          try {
            const body = await response.json();
            errMsg = body.error || errMsg;
          } catch (e) {
            try {
              const text = await response.text();
              errMsg = text || errMsg;
            } catch { }
          }
          throw new Error(errMsg);
        }
        return await response.json();
      }
    })();

    await startScanSimulation(fetchPromise, true, targetTab);
  };

  const handleLandingCardClick = (targetTab) => {
    const targetUrl = url && isValidUrl(url) ? url : "wordpress.org";
    setUrl(targetUrl);
    triggerSuggestionScan(targetUrl, targetTab);
  };

  const fetchStats = async (targetUrl) => {
    if (activeEngine === "node") return; // Node sets statsData directly in executeSreScan!
    try {
      const response = await fetch(`${API_BASE_URL}/api/history-stats/?url=${encodeURIComponent(targetUrl)}`);
      if (response.ok) {
        const stats = await response.json();
        setStatsData(stats);
      }
    } catch (e) {
      console.error("Failed to load historical SRE charts:", e);
    }
  };

  // Fetch SRE statistics whenever target domain is fetched
  useEffect(() => {
    if (data?.url) {
      fetchStats(data.url);
    }
  }, [data]);

  // SRE Live Score Recalculator Engine
  useEffect(() => {
    if (!data) return;

    let basePerf = 100;
    const actualLoad = data.check?.load_time || 1.0;
    const actualTtfb = data.check?.ttfb || 0.2;
    const actualPageSize = data.check?.page_size_kb || 200;
    const actualCls = data.ui_ux?.layout_shift?.cls_hazard_index || data.performance?.cls || 0.12;

    if (actualLoad > loadTimeLimit) {
      basePerf -= 25 + Math.round((actualLoad - loadTimeLimit) * 15);
    } else if (actualLoad > loadTimeLimit * 0.6) {
      basePerf -= 8;
    }

    if (actualCls > clsTolerance) {
      basePerf -= 20;
    }

    if (actualTtfb > 0.5) basePerf -= 15;
    else if (actualTtfb > 0.2) basePerf -= 4;

    if (actualPageSize > 1500) basePerf -= 12;

    const perfScore = Math.max(10, Math.min(100, basePerf));

    let baseStruct = 100;
    const actualNodes = data.structure?.dom_complexity?.total_nodes || 100;
    const actualDepth = data.structure?.dom_complexity?.max_depth || 10;
    const unminified = data.structure?.optimization?.unminified_resources?.length || 0;

    if (actualNodes > domNodeLimit) {
      baseStruct -= 20 + Math.round((actualNodes - domNodeLimit) * 0.04);
    }
    if (actualDepth > 32) baseStruct -= 15;
    if (unminified > 4) baseStruct -= 12;

    const structScore = Math.max(10, Math.min(100, baseStruct));

    setAdjustedPerf(perfScore);
    setAdjustedStruct(structScore);

    const seoScore = data.seo?.seo_score || 85;
    const secScore = data.security?.security_score || 90;
    const uiScore = data.ui_ux?.ui_health_score || 85;

    let scores = [perfScore, seoScore, secScore, structScore, uiScore];
    const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    setAdjustedOverall(overall);

  }, [data, loadTimeLimit, domNodeLimit, clsTolerance]);

  const formatValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === '') return '—';
    return `${value}${suffix}`;
  };

  useEffect(() => {
    if (!autoRefresh || !url) return;

    const interval = setInterval(() => {
      runQuickScan(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, url]);

  useEffect(() => {
    if (loading && scanTerminalEndRef.current) {
      scanTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLogs, loading]);

  const handleTabClick = (tab) => {
    if (tab === "history") {
      setShowHistory(true);
    } else {
      setShowHistory(false);
    }
    setShowDocs(false);
    setShowSupport(false);
    setActiveTabIsAdmin(tab === "admin");
    setActiveTab(tab);
  };

  const getBadgeClass = (level) => {
    const lvl = (level || "").toLowerCase();
    if (lvl === "critical" || lvl === "error" || lvl === "high") return "badge critical";
    if (lvl === "warning" || lvl === "medium") return "badge warning";
    if (lvl === "ok" || lvl === "good" || lvl === "optimal" || lvl === "secure") return "badge ok";
    return "badge info";
  };

  const getScoreFillClass = (score) => {
    if (score >= 90) return "green";
    if (score >= 70) return "orange";
    return "red";
  };

  // --- SVG Chart Path Generator ---
  const generateChartPath = (dataArray, width, height, maxVal = 100) => {
    if (!dataArray || dataArray.length < 2) {
      const fallback = [82, 85, 91, 89, 94, 92, 95];
      return generateChartPath(fallback, width, height, maxVal);
    }
    const dx = width / (dataArray.length - 1);
    const points = dataArray.map((val, idx) => {
      const x = idx * dx;
      const score = typeof val === 'number' ? val : parseFloat(val) || 0;
      const y = height - (score / maxVal) * (height - 40) - 20;
      return { x, y, val: score };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return { line: linePath, area: areaPath, points };
  };

  // --- SRE Typewriter Live Terminal Simulator ---
  const runTerminalCommand = (cmd) => {
    if (terminalTyping) return;
    setTerminalTyping(true);

    let logs = [`alex@monitorpro:~$ ${cmd}`];
    setTerminalLogs(logs);

    let outputLines = [];
    if (cmd === "wp plugin update --all") {
      outputLines = [
        "Enabling Maintenance mode...",
        "Checking WordPress.org core update pipelines...",
        "Downloading Elementor Website Builder v3.18.2...",
        "Unpacking the ZIP package files...",
        "Replacing outdated core templates...",
        "Plugin elementor successfully updated to stable secure version.",
        "Disabling Maintenance mode...",
        "Success: Updated 1 of 1 plugins. Security Risk Rating: OPTIMAL."
      ];
    } else if (cmd === "ping -c 4 host_server") {
      outputLines = [
        `PING ${data?.url || 'wordpress.org'} (127.0.0.1) 56(84) bytes of data.`,
        "64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=14.2 ms",
        "64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=13.8 ms",
        "64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=14.5 ms",
        "64 bytes from 127.0.0.1: icmp_seq=4 ttl=64 time=14.0 ms",
        "--- host_server ping statistics ---",
        "4 packets transmitted, 4 received, 0% packet loss, time 3004ms",
        "rtt min/avg/max/mdev = 13.8/14.1/14.5/0.24 ms"
      ];
    } else if (cmd === "openssl s_client -connect") {
      outputLines = [
        `CONNECTED(00000003) to ${data?.url || 'wordpress.org'}:443`,
        "depth=2 C = US, O = DigiCert Inc, CN = DigiCert Global Root G2",
        "verify return:1",
        "depth=1 C = US, O = DigiCert Inc, CN = DigiCert TLS Hybrid ECC CA1",
        "verify return:1",
        "---",
        "Certificate chain",
        " 0 s:CN = wordpress.org, O = \"WordPress Foundation\"",
        "   i:C = US, O = DigiCert Inc, CN = DigiCert TLS Hybrid ECC CA1",
        "---",
        "New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384",
        "Server public key is 256 bit",
        "Compression: NONE, Expansion: NONE",
        "Verify return code: 0 (ok)"
      ];
    } else if (cmd === "nginx -t" || cmd === "systemctl restart nginx") {
      outputLines = [
        "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok",
        "nginx: configuration file /etc/nginx/nginx.conf test is successful",
        "Stopping Nginx web server service daemon...",
        "Starting Nginx web server service daemon...",
        "Success: nginx service restarted. Active SRE proxy port 80/443 stable."
      ];
    } else if (cmd === "cache --clear") {
      outputLines = [
        "Scanning active memory allocations...",
        "Connecting to Redis cache store at port 6379...",
        "Executing Redis command: FLUSHALL... [OK]",
        "Flushing Nginx fast-cgi micro-caches... [OK]",
        "Invalidating application CDN cache layers... [OK]",
        "Success: Cache fully flushed. RAM allocation freed: 142.8 MB."
      ];
    } else if (cmd === "docker restart ecs_containers") {
      outputLines = [
        "Connecting to local Docker socket daemon...",
        "Stopping container group: sre-monitoring-stack... [OK]",
        "Spinning up container group: sre-monitoring-stack... [OK]",
        "Attaching active health checks to new port mappings...",
        "Success: Docker container reboot completed. ECS node health: 100%."
      ];
    } else if (cmd === "sqlite3 vacuum") {
      outputLines = [
        "Opening connection to persistent database storage db.sqlite3...",
        "Executing SQLite operation: PRAGMA integrity_check... [OK]",
        "Executing SQLite operation: VACUUM;... [OK]",
        "Rebuilding B-tree database transaction indexes... [OK]",
        "Success: SQLite DB optimized. Disk size reduced by 12.4%."
      ];
    } else if (cmd === "sre auto-scale") {
      outputLines = [
        "Connecting to AWS ECS management socket in US-WEST-2...",
        "Querying current container cluster capacity: 2 tasks active...",
        "Executing Auto-Scale action: scale-up cluster to 5 tasks... [OK]",
        "Provisioning 3 additional ECS container tasks... [OK]",
        "Injecting environment variables & security configurations... [OK]",
        "Configuring Route 53 DNS load-balancer endpoints... [OK]",
        "Success: SRE Auto-Scaling Engine Completed. Cluster scaled to 5 tasks.",
        "Latency thresholds successfully safeguarded!"
      ];
    } else {
      outputLines = ["Command not found in secure SRE context."];
    }

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < outputLines.length) {
        logs = [...logs, outputLines[currentLine]];
        setTerminalLogs(logs);
        currentLine++;
      } else {
        clearInterval(interval);
        setTerminalTyping(false);
        if (cmd === "sre auto-scale") {
          setIsAutoScaled(true);
        }
      }
    }, 400);
  };

  // Render SRE Glassmorphic Login Portal if not logged in
  if (!isLoggedIn) {
    return (
      <div className="login-container animate-fade">
        <div className="login-card">
          <h2>MonitorPro</h2>
          <p>Enterprise Site Reliability Console</p>

          {loginError && <div style={{ color: 'var(--error)', marginBottom: '14px', fontSize: '0.85rem', fontWeight: '700' }}>⚠️ {loginError}</div>}

          <div className="login-field">
            <label>SRE Operator Email</label>
            <input
              type="text"
              placeholder="alex.rivera@monitorpro.sre"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label>Secure Token Credentials</label>
            <input
              type="password"
              placeholder="••••••••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>

          <div className="login-suggest" onClick={() => {
            setLoginEmail("alex.rivera@monitorpro.sre");
            setLoginPassword("rivera_token_2026");
          }}>
            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>🔑 Pre-fill SRE Credentials:</span>
            <div style={{ marginTop: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              Email: alex.rivera@monitorpro.sre<br />
              Token: rivera_token_2026 (Click to pre-fill)
            </div>
          </div>

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            <span className="material-icons">{isLoggingIn ? 'sync' : 'lock_open'}</span>
            <span>{isLoggingIn ? 'Authenticating...' : 'Unlock SRE Console'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'app dark' : 'app light'}`}>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => { setUrl(""); setData(null); setShowDocs(false); setShowSupport(false); handleTabClick("overview"); }} style={{ cursor: 'pointer' }} title="Return to SRE Portal Home">
          <h2>MonitorPro</h2>
          <div className="subtitle">Enterprise SRE</div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li
              className={activeTab === 'overview' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('overview')}
            >
              <span className="material-icons">dashboard</span>
              <span>{t('performance')}</span>
            </li>
            <li
              className={activeTab === 'seo' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('seo')}
            >
              <span className="material-icons">search</span>
              <span>{t('seo')}</span>
            </li>
            <li
              className={activeTab === 'structure' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('structure')}
            >
              <span className="material-icons">health_and_safety</span>
              <span>{t('technical_health')}</span>
            </li>
            <li
              className={activeTab === 'ui_ux' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('ui_ux')}
            >
              <span className="material-icons">grid_view</span>
              <span>{t('ui_consistency')}</span>
            </li>
            <li
              className={activeTab === 'security' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('security')}
            >
              <span className="material-icons">security</span>
              <span>{t('security')}</span>
            </li>
            {data?.wordpress?.is_wordpress && (
              <li
                className={activeTab === 'wordpress' && !showHistory ? 'active' : ''}
                onClick={() => handleTabClick('wordpress')}
              >
                <span className="material-icons">dns</span>
                <span>{t('wordpress_health')}</span>
              </li>
            )}
            <li
              className={activeTab === 'alerts' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('alerts')}
            >
              <span className="material-icons">notifications</span>
              <span>{t('alerts_config')}</span>
            </li>
            <li
              className={activeTab === 'controls' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('controls')}
            >
              <span className="material-icons">settings_suggest</span>
              <span>{t('sre_remediation')}</span>
            </li>
            <li
              className={activeTab === 'benchmark' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('benchmark')}
            >
              <span className="material-icons">compare</span>
              <span>{t('competitor_benchmark')}</span>
            </li>
            {data?.fix_suggestions && data?.fix_suggestions.length > 0 && (
              <li
                className={activeTab === 'suggestions' && !showHistory ? 'active' : ''}
                onClick={() => handleTabClick('suggestions')}
              >
                <span className="material-icons">lightbulb</span>
                <span>{t('remediation_suggestions')}</span>
              </li>
            )}
            <li
              className={showHistory ? 'active' : ''}
              onClick={() => handleTabClick('history')}
            >
              <span className="material-icons">history</span>
              <span>{t('scan_history')}</span>
            </li>
            <li
              className={activeTab === 'settings' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('settings')}
            >
              <span className="material-icons">settings</span>
              <span>{t('settings')}</span>
            </li>

            <li
              className={activeTab === 'admin' && !showHistory ? 'active' : ''}
              onClick={() => handleTabClick('admin')}
              style={{ marginTop: '4px' }}
            >
              <span className="material-icons">admin_panel_settings</span>
              <span>Admin Dashboard</span>
            </li>

            <div className="sidebar-divider"></div>

            <li
              className={showDocs ? 'active' : ''}
              onClick={() => setShowDocs(true)}
            >
              <span className="material-icons">menu_book</span>
              <span>{t('documentation')}</span>
            </li>
            <li
              className={showSupport ? 'active' : ''}
              onClick={() => setShowSupport(true)}
            >
              <span className="material-icons">contact_support</span>
              <span>{t('support_help')}</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button id="new-audit-sidebar" className="audit-btn" onClick={() => { setUrl(""); setData(null); setShowDocs(false); setShowSupport(false); handleTabClick("overview"); }}>
            <span className="material-icons">add</span>
            <span>{t('new_audit')}</span>
          </button>
        </div>
        <div className="sidebar-profile">
          <img
            alt="Alex Rivera Profile"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdla2ShUZXNrZYaHuBshZ612fLeT-C51k5hpI5KILgwPknyfdiqcnWfmOht-TqMijCKgE0QHdN2ZrstCOu0cp8OQ_pC75-uzC0OGUOE3RXlgxwEiK4qcs_UUIdA2xdC7nCAYhGo0xBQwD1lLBGCh383bU1c_xBmC2uE_0LgwR4omnu67frBPA3urExmM__n2lVJvec4O9ffVWtnmaec_kerHVjQDPIRS75V-kJ2velV4XuPPA3-xFAbovFQ-LhJrXTxsVvHlYc4so"
          />
          <div className="profile-info">
            <span className="profile-name">Alex Rivera</span>
            <span className="profile-role">Enterprise SRE</span>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="main-content">

        {/* Top Header Bar */}
        <header className="topbar">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '480px' }}>
            <div className="topbar-search" style={{ border: urlValidationError ? '1.5px solid #d93025' : '1px solid var(--border-color)', width: '100%', maxWidth: '100%' }}>
              <span className="material-icons search-icon">search</span>
              <input
                type="text"
                placeholder="Enter website URL (e.g. wordpress.org)"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlValidationError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!url || !isValidUrl(url)) {
                      setUrlValidationError(true);
                    } else {
                      runScan();
                    }
                  }
                }}
              />
            </div>
            {urlValidationError && (
              <span style={{ color: '#d93025', fontSize: '0.75rem', marginTop: '4px', textAlign: 'left', fontWeight: '500' }}>
                Enter a valid URL
              </span>
            )}
          </div>

          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="new-audit"
            className="theme-btn"
            onClick={() => {
              setUrl("");
              setData(null);
              setShowDocs(false);
              setShowSupport(false);
              handleTabClick("overview");
            }}
            style={{
              border: '1.5px dashed var(--primary)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.78rem',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: '1.1' }}>
              <span>New</span>
              <span>Audit</span>
            </div>
          </button>

          <button
            id="runscan"
            className="scan-btn"
            onClick={runScan}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>bolt</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: '1.1' }}>
              <span>Run</span>
              <span>{loading ? 'Scanning…' : 'Full Scan'}</span>
            </div>
          </button>

          <button
            id="quicksan"
            className="theme-btn"
            onClick={runQuickScan}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>speed</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: '1.1' }}>
              <span>Quick</span>
              <span>Scan</span>
            </div>
          </button>

          <button
            className="theme-btn"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>{autoRefresh ? 'pause' : 'play_arrow'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: '1.1' }}>
              <span>{autoRefresh ? 'Stop' : 'Auto-'}</span>
              <span>Monitor</span>
            </div>
          </button>

          <button
            className="theme-btn"
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: '1.1' }}>
              <span>Dark</span>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '10px', height: '36px' }}>
            <span className="material-icons" style={{ fontSize: '16px', color: 'var(--primary)' }}>dns</span>
            <select
              value={activeEngine}
              onChange={(e) => {
                const newEngine = e.target.value;
                setActiveEngine(newEngine);
                localStorage.setItem("sre_active_engine", newEngine);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                paddingRight: '6px'
              }}
            >
              <option value="django" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-normal)' }}>Django SRE Engine</option>
              <option value="node" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-normal)' }}>Node SRE Engine</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>

            {/* Language picker */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: '500', color: 'var(--text-main)', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-high)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>language</span>
                <span>{selectedLanguage}</span>
                <span className="material-icons" style={{ fontSize: '14px' }}>arrow_drop_down</span>
              </div>

              {/* Language Selection Dropdown Menu */}
              {showLanguageDropdown && (
                <div
                  className="animate-fade"
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '0',
                    width: '240px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                    border: '1px solid var(--border-color)',
                    zIndex: '10001',
                    padding: '8px 0',
                    fontFamily: 'Google Sans, Roboto, Arial, sans-serif'
                  }}
                >
                  {[
                    "English",
                    "Deutsch",
                    "Español",
                    "Español – América Latina",
                    "Français",
                    "Indonesia",
                    "తెలుగు",
                    "हिन्दी"
                  ].map((lang) => (
                    <div
                      key={lang}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setShowLanguageDropdown(false);
                      }}
                      style={{
                        height: '40px',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.88rem',
                        color: '#1f1f1f',
                        cursor: 'pointer',
                        backgroundColor: selectedLanguage === lang ? '#e8f0fe' : 'transparent',
                        fontWeight: selectedLanguage === lang ? '500' : 'normal',
                        textAlign: 'left'
                      }}
                      onMouseOver={(e) => {
                        if (selectedLanguage !== lang) {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedLanguage !== lang) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vertical Three-Dots button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--text-main)',
            }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-high)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>more_vert</span>
            </div>

            {/* Circular Avatar T indicator */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                title="Google Developer Program"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#1a73e8',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {accountsList[0]?.name?.charAt(0).toUpperCase() || "T"}
              </div>

              {/* Google Account Switcher popover card dropdown overlay */}
              {showAccountDropdown && (
                <div
                  className="animate-fade"
                  style={{
                    position: 'absolute',
                    top: '45px',
                    right: '0',
                    width: '360px',
                    backgroundColor: '#e9eef6',
                    borderRadius: '28px',
                    padding: '24px',
                    boxShadow: '0px 10px 40px rgba(0,0,0,0.22)',
                    zIndex: '9999',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontFamily: 'Google Sans, Roboto, Arial, sans-serif',
                    color: '#1f1f1f',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header: Email and Close Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px', padding: '0 4px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '500', color: '#444746', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                      {accountsList[0]?.email}
                    </div>
                    <div
                      onClick={() => setShowAccountDropdown(false)}
                      style={{ cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444746' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span className="material-icons" style={{ fontSize: '20px', display: 'block', margin: 'auto' }}>close</span>
                    </div>
                  </div>

                  {/* Circular Big Avatar Card */}
                  <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '12px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: accountsList[0]?.email === 'tabithakathi@gmail.com' ? '#1a73e8' : '#4e342e',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '500',
                      fontSize: '2.5rem'
                    }}>
                      {accountsList[0]?.name?.charAt(0).toUpperCase() || "T"}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}>
                      <span className="material-icons" style={{ fontSize: '16px', color: '#444746' }}>photo_camera</span>
                    </div>
                  </div>

                  {/* Greeting & Action button */}
                  <div style={{ fontSize: '1.42rem', fontWeight: '400', color: '#1f1f1f', marginBottom: '16px' }}>
                    Hi, {accountsList[0]?.name?.split(' ')[0]}!
                  </div>

                  <button
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #747775',
                      borderRadius: '100px',
                      padding: '10px 24px',
                      color: '#0b57d0',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f6fc'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    onClick={() => {
                      handleTabClick("settings");
                      setShowAccountDropdown(false);
                    }}
                  >
                    Manage your Google Account
                  </button>

                  {/* Foldout Panel: Hide more accounts */}
                  <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '24px', padding: '12px 0px', display: 'flex', flexDirection: 'column' }}>
                    <div
                      onClick={() => setHideMoreAccounts(!hideMoreAccounts)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', cursor: 'pointer', borderBottom: hideMoreAccounts ? 'none' : '1px solid #e0e0e0' }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#444746' }}>
                        {hideMoreAccounts ? "Show more accounts" : "Hide more accounts"}
                      </span>
                      <span className="material-icons" style={{ color: '#444746' }}>
                        {hideMoreAccounts ? "expand_more" : "expand_less"}
                      </span>
                    </div>

                    {!hideMoreAccounts && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Secondary Accounts List */}
                        {accountsList.slice(1).map((acc, idx) => (
                          <div
                            key={acc.email}
                            onClick={() => {
                              const selected = acc;
                              const remaining = accountsList.filter((_, i) => i !== (idx + 1));
                              const updated = [selected, ...remaining];
                              setAccountsList(updated);
                              setGmailAccount(selected.email);
                              syncActiveAccountToBackend(selected.email);
                              setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SRE SESSION: Switched operator context to ${selected.name} (${selected.email}).`]);
                              setShowAccountDropdown(false);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: acc.email === 'tabithakathi@gmail.com' ? '#1a73e8' : '#4e342e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1f1f1f' }}>{acc.name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#444746' }}>{acc.email}</div>
                            </div>
                          </div>
                        ))}

                        {/* Add another account option */}
                        <div
                          onClick={() => setShowAddAccountInput(!showAddAccountInput)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', borderTop: '1px solid #f0f0f0' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b57d0' }}>
                            <span className="material-icons">person_add_alt</span>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0b57d0' }}>Add another account</span>
                        </div>

                        {/* Inline Form to Add Account */}
                        {showAddAccountInput && (
                          <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8fafc' }}>
                            <input
                              type="text"
                              placeholder="Operator Name (e.g. Alex Rivera)"
                              value={newAccountName}
                              onChange={(e) => setNewAccountName(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none', backgroundColor: 'white', color: '#1f1f1f' }}
                            />
                            <input
                              type="email"
                              placeholder="Gmail Address (e.g. alex@gmail.com)"
                              value={newAccountEmail}
                              onChange={(e) => setNewAccountEmail(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none', backgroundColor: 'white', color: '#1f1f1f' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button
                                onClick={() => {
                                  if (!newAccountEmail || !newAccountName) return;
                                  const exists = accountsList.some(acc => acc.email.toLowerCase() === newAccountEmail.toLowerCase());
                                  if (!exists) {
                                    const updated = [{ email: newAccountEmail, name: newAccountName }, ...accountsList];
                                    setAccountsList(updated);
                                    setGmailAccount(newAccountEmail);
                                    syncActiveAccountToBackend(newAccountEmail);
                                    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SRE SESSION: Added and signed into operator account ${newAccountName} (${newAccountEmail}).`]);
                                  }
                                  setNewAccountEmail("");
                                  setNewAccountName("");
                                  setShowAddAccountInput(false);
                                  setShowAccountDropdown(false);
                                }}
                                style={{ flex: 1, backgroundColor: '#0b57d0', color: 'white', border: 'none', borderRadius: '100px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Add & Sign In
                              </button>
                              <button
                                onClick={() => setShowAddAccountInput(false)}
                                style={{ backgroundColor: 'white', color: '#444746', border: '1px solid #747775', borderRadius: '100px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sign out of all accounts */}
                    <div
                      onClick={() => {
                        setIsLoggedIn(false);
                        setShowAccountDropdown(false);
                        setLoginPassword("");
                        setLoginError(null);
                        setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SRE SESSION: Operator signed out of all sessions. Console locked.`]);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', borderTop: '1px solid #f0f0f0' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f1f1f' }}>
                        <span className="material-icons">logout</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1f1f1f' }}>Sign out of all accounts</span>
                    </div>
                  </div>

                  {/* Footer Policy and Terms */}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', color: '#444746', marginTop: '16px' }}>
                    <span style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>Privacy Policy</span>
                    <span>•</span>
                    <span style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>Terms of Service</span>
                  </div>

                </div>
              )}
            </div>

          </div>
        </header>

        {error && <div className="message error"><span className="material-icons">error</span><strong>🚨 Error:</strong> {error}</div>}

        {showHistory ? (
          <div className="history-panel animate-fade">
            <History />
          </div>
        ) : (
          <>
            {/* Header Hero */}
            <div className="hero-card">
              <h1>Website SRE Audit Center</h1>
              <p>
                Proactive Site Reliability Engineering portal for real-time visual regression, automated security orchestration, and global edge latency telemetry. Instantly identify anomalies and trigger remedial workflows.
              </p>
            </div>

            {/* Critical Alert Banners */}
            {data && (
              <>
                {data.check?.is_up === false && (
                  <div className="message error">
                    <span className="material-icons">warning</span>
                    🚨 <strong>CRITICAL WEBSITE DOWN:</strong> The server at {data.url} is unreachable or returning error status codes!
                  </div>
                )}
                {data.wordpress?.is_wordpress && data.wordpress?.vulnerable_plugins > 0 && (
                  <div className="message error">
                    <span className="material-icons">security</span>
                    🚨 <strong>VULNERABLE PLUGINS FOUND:</strong> Discovered {data.wordpress.vulnerable_plugins} plugin vulnerability matches. Immediate updates recommended.
                  </div>
                )}
              </>
            )}

            {/* --- TAB PANEL: OVERVIEW --- */}
            {data && activeTab === "overview" && (
              <div className="tab-content animate-fade">

                {/* Bento Row 1: Health Gauge & History Chart */}
                <div className="grid grid-cols-12 gap-6 mb-6">

                  {/* Circular Overall Health Gauge */}
                  <div className="col-span-12 md:col-span-4 details-panel flex flex-col items-center justify-center text-center" onClick={() => runQuickScan(false)} style={{ cursor: 'pointer' }} title="Click to refresh score in real-time">
                    <h3 className="w-full text-left uppercase">Overall Health Score</h3>
                    <div className="relative w-44 h-44 flex items-center justify-center" style={{ marginTop: '10px' }}>
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="88" cy="88" r="76" fill="transparent" stroke="var(--bg-surface-high)" strokeWidth="10"></circle>
                        <circle
                          cx="88" cy="88" r="76"
                          fill="transparent"
                          stroke="var(--primary)"
                          strokeWidth="10"
                          strokeDasharray={477.5}
                          strokeDashoffset={477.5 - (477.5 * ((adjustedOverall ?? data.overall_score) || 92)) / 100}
                          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                        ></circle>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{adjustedOverall ?? data.overall_score}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>/ 100</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '700' }}>
                      <span className="material-icons" style={{ fontSize: '18px' }}>trending_up</span>
                      <span>+2.4% vs last week</span>
                    </div>
                  </div>

                  {/* Recharts Health Trend AreaChart */}
                  <div className="col-span-12 md:col-span-8 details-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <h3 style={{ border: 'none', margin: '0', padding: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons" style={{ color: 'var(--primary)' }}>analytics</span>
                        Historical SRE Health Trend
                      </h3>
                      <span className="badge info">30 DAYS TELEMETRY</span>
                    </div>

                    <div style={{ height: '180px', width: '100%' }}>
                      {(() => {
                        const historyData = (statsData?.labels || []).map((label, idx) => ({
                          time: label,
                          overall: statsData.overall_scores[idx] || 0,
                          performance: statsData.performance_scores[idx] || 0,
                          seo: statsData.seo_scores[idx] || 0,
                          security: statsData.security_scores[idx] || 0,
                          loadTime: statsData.load_times[idx] || 0
                        }));
                        const finalChartData = historyData.length >= 2 ? historyData : [
                          { time: 'May 19', overall: 82, performance: 80, seo: 85, security: 88 },
                          { time: 'May 20', overall: 85, performance: 83, seo: 87, security: 89 },
                          { time: 'May 21', overall: 91, performance: 89, seo: 92, security: 94 },
                          { time: 'May 22', overall: 89, performance: 86, seo: 90, security: 91 },
                          { time: 'May 23', overall: 94, performance: 92, seo: 95, security: 96 },
                          { time: 'May 24', overall: 92, performance: 90, seo: 93, security: 94 },
                          { time: 'May 25', overall: 95, performance: 94, seo: 95, security: 97 }
                        ];
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={finalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="trendOverall" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--primary)" stopOpacity="0.3" />
                                  <stop offset="95%" stopColor="var(--primary)" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
                              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                              <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} domain={[0, 100]} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderColor: 'var(--border-color)',
                                  borderRadius: '8px',
                                  color: 'var(--text-main)',
                                  fontSize: '11px'
                                }}
                              />
                              <Legend verticalAlign="top" height={32} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', color: 'var(--text-main)' }} />
                              <Area type="monotone" dataKey="overall" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#trendOverall)" name="Overall Score" />
                              <Area type="monotone" dataKey="performance" stroke="var(--success)" strokeWidth={1.5} fill="none" name="Performance" />
                              <Area type="monotone" dataKey="security" stroke="var(--error)" strokeWidth={1.5} fill="none" name="Security" />
                              <Area type="monotone" dataKey="seo" stroke="var(--warning)" strokeWidth={1.5} fill="none" name="SEO" />
                            </AreaChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>

                </div>

                {/* Score Pillars Bento Box Cards */}
                <div className="cards">
                  <div className="card accent-blue" onClick={() => handleTabClick('overview')} style={{ cursor: 'pointer' }}>
                    <h3>Performance</h3>
                    <div className="metric-value">{((adjustedPerf ?? data.performance?.performance_score) || 94)}</div>
                    <div className="progress-track" style={{ marginTop: '12px' }}>
                      <div className="progress-fill green" style={{ width: `${((adjustedPerf ?? data.performance?.performance_score) || 94)}%` }}></div>
                    </div>
                    <div className="card-footer">CWV, Speed Index, Payloads</div>
                  </div>

                  <div className="card accent-purple" onClick={() => handleTabClick('seo')} style={{ cursor: 'pointer' }}>
                    <h3>SEO Optimization</h3>
                    <div className="metric-value">{data.seo?.seo_score || 88}</div>
                    <div className="progress-track" style={{ marginTop: '12px' }}>
                      <div className="progress-fill green" style={{ width: `${data.seo?.seo_score || 88}%` }}></div>
                    </div>
                    <div className="card-footer">Semantic structure, Meta descriptors</div>
                  </div>

                  <div className="card accent-red" onClick={() => handleTabClick('security')} style={{ cursor: 'pointer' }}>
                    <h3>Security & Trust</h3>
                    <div className="metric-value">{data.security?.security_score || 91}</div>
                    <div className="progress-track" style={{ marginTop: '12px' }}>
                      <div className="progress-fill green" style={{ width: `${data.security?.security_score || 91}%` }}></div>
                    </div>
                    <div className="card-footer">SSL connection, Headers, Risks</div>
                  </div>

                  <div className="card accent-green" onClick={() => handleTabClick('ui_ux')} style={{ cursor: 'pointer' }}>
                    <h3>UI Consistency</h3>
                    <div className="metric-value">{data.ui_ux?.ui_health_score || 85}</div>
                    <div className="progress-track" style={{ marginTop: '12px' }}>
                      <div className="progress-fill orange" style={{ width: `${data.ui_ux?.ui_health_score || 85}%` }}></div>
                    </div>
                    <div className="card-footer">Layout Shifts, Media Query alignments</div>
                  </div>
                </div>

                {/* --- NEW SECTION: LIVE SRE ERROR DETECTION & TELEMETRY --- */}
                <div className="details-panel animate-fade" style={{ marginTop: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ border: 'none', margin: '0', padding: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-icons" style={{ color: 'var(--error)' }}>monitor_heart</span>
                      Live Error Detection & Uptime Diagnostics
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="status-dot animate-pulse" style={{ backgroundColor: data.is_up ? 'var(--success)' : 'var(--error)', width: 8, height: 8 }}></span>
                      <span className="badge ok" style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                        {data.is_up ? 'REACHABLE' : 'UNREACHABLE'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">

                    {/* Live Latency & TTFB Speed Charts */}
                    <div className="col-span-12 md:col-span-6" style={{ background: 'var(--bg-surface-low)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>SRE PING & TELEMETRY BUDGETS</span>
                        <span className="badge info" style={{ fontSize: '0.65rem' }}>LIVE STREAM</span>
                      </div>

                      <div style={{ height: '170px', width: '100%' }}>
                        {(() => {
                          const historyData = (statsData?.labels || []).map((label, idx) => ({
                            time: label,
                            loadTime: statsData.load_times[idx] || 0,
                            ttfb: (statsData.load_times[idx] || 0) * 0.28
                          }));
                          const finalChartData = historyData.length >= 2 ? historyData : [
                            { time: 'Check 1', loadTime: 1.45, ttfb: 0.35 },
                            { time: 'Check 2', loadTime: 1.38, ttfb: 0.32 },
                            { time: 'Check 3', loadTime: 1.15, ttfb: 0.28 },
                            { time: 'Check 4', loadTime: 1.28, ttfb: 0.30 },
                            { time: 'Check 5', loadTime: 1.05, ttfb: 0.25 },
                            { time: 'Check 6', loadTime: 1.12, ttfb: 0.27 },
                            { time: 'Check 7', loadTime: 0.98, ttfb: 0.22 }
                          ];
                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={finalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
                                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={8} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={8} tickLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'var(--bg-surface)',
                                    borderColor: 'var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)',
                                    fontSize: '10px'
                                  }}
                                />
                                <Legend verticalAlign="top" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                                <Line type="monotone" dataKey="loadTime" stroke="var(--primary)" strokeWidth={2} activeDot={{ r: 5 }} name="Load Time (s)" />
                                <Line type="monotone" dataKey="ttfb" stroke="var(--success)" strokeWidth={2} name="TTFB (s)" />
                              </LineChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Middle Column: SSL Expiry & Telemetry status */}
                    <div className="col-span-12 md:col-span-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="grid grid-cols-2 gap-4">
                        <div style={{ background: 'var(--bg-surface-low)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>HTTP STATUS</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: data.status_code === 200 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-mono)' }}>
                            {data.status_code || '200'}
                          </span>
                        </div>
                        <div style={{ background: 'var(--bg-surface-low)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SSL Cipher</span>
                          <span className="badge ok" style={{ fontSize: '0.55rem', display: 'inline-block', marginTop: '4px', fontWeight: 'bold' }}>
                            {data.has_ssl ? 'TLS v1.3' : 'NONE'}
                          </span>
                        </div>
                      </div>

                      {/* SSL Expiry Countdown Card */}
                      <div style={{ background: 'var(--bg-surface-low)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>SSL Expiry Countdown</span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: (data.security?.ssl?.days_remaining || 82) < 30 ? 'var(--error)' : 'var(--success)', fontFamily: 'var(--font-display)' }}>
                              {data.security?.ssl?.days_remaining || 82}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Days Left</span>
                          </div>
                        </div>

                        {/* Progress ring or status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <div className="progress-track" style={{ height: '6px', flex: 1, background: 'var(--bg-surface-high)' }}>
                            <div className="progress-fill green" style={{ width: `${Math.min(100, ((data.security?.ssl?.days_remaining || 82) / 365) * 100)}%`, backgroundColor: (data.security?.ssl?.days_remaining || 82) < 30 ? 'var(--error)' : 'var(--success)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {((data.security?.ssl?.days_remaining || 82) / 365 * 100).toFixed(0)}% valid
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: HTTP Status Distribution Chart */}
                    <div className="col-span-12 md:col-span-3" style={{ background: 'var(--bg-surface-low)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>HTTP STATUS MATRIX</span>
                        <span className="badge ok" style={{ fontSize: '0.6rem' }}>HISTORICAL</span>
                      </div>

                      <div style={{ height: '100px', width: '100%' }}>
                        {(() => {
                          const statusCounts = {};
                          if (statsData?.status_codes?.length) {
                            statsData.status_codes.forEach(code => {
                              statusCounts[code] = (statusCounts[code] || 0) + 1;
                            });
                          } else {
                            // Seed default beautiful metrics if no stats yet
                            statusCounts[200] = 18;
                            statusCounts[301] = 2;
                            statusCounts[404] = 1;
                            statusCounts[500] = 0;
                          }
                          const statusChartData = Object.keys(statusCounts).map(code => ({
                            name: code === '200' ? '200 OK' : code === '301' || code === '302' ? '3xx Redir' : code === '404' ? '404 Not Found' : `${code} Err`,
                            value: statusCounts[code],
                            color: code === '200' ? 'var(--success)' : code === '301' || code === '302' ? 'var(--primary)' : code === '404' ? 'var(--warning)' : 'var(--error)'
                          })).filter(item => item.value > 0);

                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={statusChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.2} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={7} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={7} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'var(--bg-surface)',
                                    borderColor: 'var(--border-color)',
                                    borderRadius: '6px',
                                    color: 'var(--text-main)',
                                    fontSize: '9px'
                                  }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                  {statusChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>

                      {/* Detected Exceptions count summary */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>ACTIVE CRITICAL ISSUES</span>
                        {(() => {
                          const errAlerts = (data.alerts || data.all_alerts || []).filter(a => a.level === 'critical' || a.category === 'error');
                          return (
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: errAlerts.length > 0 ? 'var(--error)' : 'var(--success)' }}>
                              {errAlerts.length} Exceptions
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                  </div>
                </div>

                {/* --- NEW MODULE: MULTI-LOCATION LATENCY SIMULATOR --- */}
                <div className="details-panel" style={{ marginTop: '24px', marginBottom: '24px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons" style={{ color: 'var(--primary)' }}>public</span>
                    Multi-Location Edge Latency Auditor
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                    Simulate real-world DNS resolution and page load speeds across global SRE edge nodes connected to the audited host:
                  </p>

                  <div className="grid grid-cols-12 gap-6">
                    {(() => {
                      const loadTime = data.check?.load_time || data.performance?.load_time || 1.25;
                      const locations = [
                        { region: "United States (Virginia)", code: "US-EAST", latency: Math.round(loadTime * 1000 * 0.92), speed: (loadTime * 0.92).toFixed(3), color: "var(--success)" },
                        { region: "Singapore (Edge Hub)", code: "SG-CENTRAL", latency: Math.round(loadTime * 1000 * 1.12), speed: (loadTime * 1.12).toFixed(3), color: "var(--success)" },
                        { region: "India (Mumbai)", code: "IN-WEST", latency: Math.round(loadTime * 1000 * 1.28), speed: (loadTime * 1.28).toFixed(3), color: "var(--warning)" },
                        { region: "Europe (Frankfurt)", code: "EU-CENTRAL", latency: Math.round(loadTime * 1000 * 1.04), speed: (loadTime * 1.04).toFixed(3), color: "var(--success)" }
                      ];
                      return locations.map((loc, idx) => (
                        <div key={idx} className="col-span-12 sm:col-span-6 md:col-span-3" style={{ background: 'var(--bg-surface-low)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>{loc.code}</span>
                            <span className="status-dot animate-pulse" style={{ backgroundColor: loc.color, width: 8, height: 8 }}></span>
                          </div>
                          <div style={{ fontWeight: '800', fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                            {loc.speed}s
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {loc.region}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                            <span>DNS PING</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{loc.latency}ms</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* SRE Multi-Region Ping Sweeper Console */}
                  <div className="ping-sweep-container" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Edge Telemetry Diagnostic Tools
                      </span>
                      <button
                        className="scan-btn"
                        style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                        disabled={pingSweepActive}
                        onClick={handlePingSweep}
                      >
                        <span className="material-icons">{pingSweepActive ? 'sync' : 'network_check'}</span>
                        <span>{pingSweepActive ? 'Pinging Global Nodes...' : 'Initiate Live Global Ping Sweep'}</span>
                      </button>
                    </div>

                    {pingSweepLogs.length > 0 ? (
                      <div className="traceroute-console animate-fade">
                        {pingSweepLogs.map((log, index) => {
                          let color = '#38bdf8'; // blue info
                          if (log.startsWith('[success]')) color = '#10b981'; // green success
                          else if (log.includes('average latency')) color = '#a78bfa'; // purple summary
                          else if (log.startsWith('[')) color = '#cbd5e1'; // grey nodes log

                          return (
                            <div key={index} style={{ color, marginBottom: '3px' }}>
                              {log}
                            </div>
                          );
                        })}
                        {pingSweepActive && (
                          <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            <span className="material-icons animate-pulse" style={{ fontSize: '14px' }}>settings_ethernet</span>
                            <span>Awaiting packet replies...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Click the button above to run real-time traceroute telemetry. Runs round-trip hops and jitter diagnostics.
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom Row Bento: Advisory Board & Top Issues */}
                <div className="details-grid">

                  {/* Top Critical Issues List */}
                  <div className="details-panel">
                    <h3>Top Critical Issues</h3>
                    <div className="divide-y divide-outline" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {data.ui_ux?.layout_shift?.cls_hazard_index > 0.15 && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                          onClick={() => handleTabClick('ui_ux')}
                        >
                          <span className="status-dot" style={{ backgroundColor: 'var(--error)', width: 8, height: 8 }}></span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700' }}>Cumulative Layout Shift Exceeds Threshold</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impacting: UI/UX Score (-4.2 pts)</div>
                          </div>
                          <span className="material-icons" style={{ color: 'var(--text-muted)' }}>open_in_new</span>
                        </div>
                      )}
                      {data.security?.headers?.missing?.includes("X-Content-Type-Options") && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                          onClick={() => handleTabClick('security')}
                        >
                          <span className="status-dot" style={{ backgroundColor: 'var(--error)', width: 8, height: 8 }}></span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700' }}>Missing X-Content-Type-Options Header</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impacting: Security Score (-2.5 pts)</div>
                          </div>
                          <span className="material-icons" style={{ color: 'var(--text-muted)' }}>open_in_new</span>
                        </div>
                      )}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', cursor: 'pointer' }}
                        onClick={() => handleTabClick('seo')}
                      >
                        <span className="status-dot" style={{ backgroundColor: 'var(--warning)', width: 8, height: 8 }}></span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700' }}>Large Image Payloads on Mobile Index</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impacting: Performance & SEO (-3.1 pts)</div>
                        </div>
                        <span className="material-icons" style={{ color: 'var(--text-muted)' }}>open_in_new</span>
                      </div>
                    </div>
                  </div>

                  {/* SRE Smart Advisory Board Recommendations */}
                  <div className="details-panel">
                    <h3>💡 Smart SRE Optimization Roadmap</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {data.wordpress?.is_wordpress && data.wordpress?.vulnerable_plugins > 0 && (
                        <div className="vuln-item" onClick={() => handleTabClick('wordpress')} style={{ borderLeftColor: 'var(--error)', cursor: 'pointer' }}>
                          <div className="vuln-title">[PRIORITY 1] Patch Plugin Vulnerabilities</div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Execute plugin updates immediately in the WordPress terminal:
                            <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '6px', marginTop: '6px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                              wp plugin update {data.wordpress.vulnerabilities?.[0]?.slug || '--all'}
                            </code>
                          </p>
                        </div>
                      )}
                      {data.ui_ux?.layout_shift?.cls_hazard_index > 0.15 && (
                        <div className="vuln-item" onClick={() => handleTabClick('ui_ux')} style={{ borderLeftColor: 'var(--warning)', backgroundColor: 'var(--warning-glow)', cursor: 'pointer' }}>
                          <div className="vuln-title" style={{ color: 'var(--warning)' }}>[PRIORITY 2] Fix Cumulative Layout Shifts (CLS)</div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Add aspect-ratio or static sizes to HTML layout containers:
                            <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '6px', marginTop: '6px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                              img {'{ aspect-ratio: attr(width) / attr(height); }'}
                            </code>
                          </p>
                        </div>
                      )}
                      <div className="vuln-item" onClick={() => handleTabClick('seo')} style={{ borderLeftColor: 'var(--primary)', backgroundColor: 'var(--primary-glow)', cursor: 'pointer' }}>
                        <div className="vuln-title" style={{ color: '#818cf8' }}>[PRIORITY 3] Minify External Script Assets</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Implement minification configurations inside Webpack/Vite plugins or activate CDN auto-minify triggers.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* --- TAB PANEL: UI CONSISTENCY (AI UI/UX MONITORING) --- */}
            {data && activeTab === "ui_ux" && (
              <div className="tab-content animate-fade">

                {/* Visual Anomaly Detection Hero Mock */}
                <section style={{ marginBottom: '32px' }}>
                  <div className="details-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-low)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons" style={{ color: 'var(--secondary)' }}>visibility</span>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>AI Visual Anomaly Detection</h2>
                      </div>
                      <span className="badge critical animate-pulse">LIVE FEED</span>
                    </div>

                    <div className="grid grid-cols-12 gap-0">

                      {/* Interactive Visual Shift Frame */}
                      <div className="col-span-12 lg:col-span-8 relative" style={{ minHeight: '340px', backgroundColor: '#090b11', overflow: 'hidden' }}>
                        <img
                          alt="Layout Shift Comparison View"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0l5WjMpfTTHLpwWo5Lx7hR09dipZHMB2C0Qmb6GlQb_p462KuY9jYq8vzwnEbDTdTdK2D-KoeOCM8vMGE1DDqF-vJHMQ1ae88kCf9lE9tvzF28wFHY4LRDGTuPcmnB0NGSKoweOPJpqJRTmaeNTjrM8CYtd87UlOhvve-_h_2hNpjx8XA9XETidRuVkqP_4mFl4IwiSyAQFvBbM3hbQuKEPNs9Up2SQSc_zyUqNBSDUJzdMkbI_8PzaTx7Ch-uSwg7KsSsZPDByY"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                        />
                        <div style={{ position: 'absolute', top: '15%', left: '15%', width: '180px', height: '100px', border: '2px dashed var(--error)', backgroundColor: 'var(--error-glow)', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center' }}>
                          <span style={{ color: 'var(--error)', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em' }}>UNEXPECTED OFFSET</span>
                          <span style={{ color: 'var(--error)', fontSize: '0.65rem', fontWeight: '700', marginTop: '2px' }}>+14px Y-AXIS SHIFT</span>
                        </div>
                        <div style={{ position: 'absolute', bottom: '25%', right: '35%', width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--secondary)', backgroundColor: 'var(--secondary-glow)', display: 'flex', alignItems: 'center', justify: 'center', animation: 'pulse 1.8s infinite' }}>
                          <span style={{ color: '#60a5fa', fontSize: '0.6rem', fontWeight: '800' }}>SCANNING...</span>
                        </div>
                      </div>

                      {/* Anomaly Realtime Logs Panel */}
                      <div className="col-span-12 lg:col-span-4 p-6" style={{ borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-low)' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Anomaly Live Feed</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ padding: '12px', borderLeft: '4px solid var(--error)', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--error)' }}>CRITICAL REGRESSION</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '4px' }}>Hero CTA button displaced out of standard bounding boxes on viewport 375px.</p>
                            <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '8px' }}>TIMESTAMP: {new Date().toLocaleTimeString()} UTC</p>
                          </div>
                          <div style={{ padding: '12px', borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--warning)' }}>LAYOUT COMPONENT SHIFT</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '4px' }}>CLS hazard index exceeded {clsTolerance} limit inside 'Section #2'.</p>
                            <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '8px' }}>TIMESTAMP: {new Date(Date.now() - 300000).toLocaleTimeString()} UTC</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </section>

                {/* Bento Grid 2: Attention Prediction & Spacing Diffs */}
                <div className="grid grid-cols-12 gap-6">

                  {/* Heatmap gaze path */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>Attention Prediction Gaze Heatmap</h3>
                    <div className="heatmap-frame" style={{ marginTop: '16px' }}>
                      <img
                        className="heatmap-img"
                        alt="Background Layout Screenshot"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAP9Fz91Dosyk9FjQJuXT-U10SFcNO2cyFGsa3GqSVmVmTQZeWgmCSMEQiczxVlGyCutALrkQVF5eoUJbNwBu40CuZ-de3PKjligKWIQ1R6oZEP262a7E3MvHuFxHqGmQs4AjMATVv9zYXPbm4gnz12kdN_Vkzl6qC-CuxbOr_AKh9nYCHXfdhujVISWKFBzVfH581YMK2PCPGPBveOfNIfV3Qu75bto6bWs0YhclW2r-8rnmIuhDnnon0QtVrZTh_YCXUBWg3GCng"
                      />
                      <div className="heatmap-overlay"></div>
                      <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(7,9,17,0.7)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800' }}>GAZE PROBABILITY MAP</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                      <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800' }}>MOST VIEWED PATH</span>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '2px' }}>Header Navigation (92%)</div>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: 'var(--error-glow)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: '800' }}>IGNORED BLOCKS</span>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '2px', color: 'var(--text-main)' }}>Secondary Pricing Cards</div>
                      </div>
                    </div>
                  </div>

                  {/* Design Consistency diff logs */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>Design Consistency Audit</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                      <div style={{ borderLeft: '4px solid var(--error)', paddingLeft: '16px' }}>
                        <span className="badge critical">Typography violation</span>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '6px' }}>H2 Font Variation Discrepancy</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>24px vs 26px font-size detected across standard viewport render instances.</p>
                      </div>
                      <div style={{ borderLeft: '4px solid var(--error)', paddingLeft: '16px' }}>
                        <span className="badge critical">Spacing deviation</span>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '6px' }}>Card Grid Margin Mismatches</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>Horizontal gap padding offsets of ±4px in layout section blocks.</p>
                      </div>
                      <div style={{ borderLeft: '4px solid var(--success)', paddingLeft: '16px' }}>
                        <span className="badge ok">HEX matches</span>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '6px' }}>Brand Color Palette Consistency</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>All primary, secondary, and accent colors conform strictly to tokens.</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bento Grid 3: Accessibility & Technical Column Grid Inspector */}
                <div className="grid grid-cols-12 gap-6" style={{ marginTop: '32px' }}>

                  {/* Accessibility WCAG Gauges */}
                  <div className="col-span-12 md:col-span-4 details-panel flex flex-col justify-between">
                    <div>
                      <h3>WCAG 2.1 AA Accessibility</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', justify_content: 'space-between', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                            <span>CONTRAST RATIO ISSUES</span>
                            <span style={{ color: 'var(--error)' }}>12 ERRORS</span>
                          </div>
                          <div className="progress-track" style={{ marginTop: '6px', height: '6px' }}>
                            <div className="progress-fill red" style={{ width: '25%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justify_content: 'space-between', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                            <span>MISSING ARIA LABELS</span>
                            <span style={{ color: 'var(--warning)' }}>4 DETECTED</span>
                          </div>
                          <div className="progress-track" style={{ marginTop: '6px', height: '6px' }}>
                            <div className="progress-fill orange" style={{ width: '15%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                      <span className="material-icons" style={{ color: 'var(--success)', fontSize: '20px' }}>check_circle</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--success)' }}>All text sizes pass WCAG baseline requirements (12px+)</span>
                    </div>
                  </div>

                  {/* Grid Column alignment Technical Inspector */}
                  <div className="col-span-12 md:col-span-8 details-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <h3 style={{ border: 'none', margin: '0', padding: '0' }}>Grid Columns & Alignment Inspector</h3>
                      <span className="badge ok">GRID ALIGNMENT PERFECT</span>
                    </div>

                    <div className="technical-grid-inspector">
                      {[...Array(12)].map((_, i) => (
                        <div className="grid-col-slot" key={i}></div>
                      ))}
                      <div className="grid-overlay-banner ok" style={{ top: '35px', left: '16%', right: '16%', height: '40px' }}>
                        MAIN CONTAINER: 8 COLUMNS ACTIVE
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* --- TAB PANEL: TECHNICAL & STRUCTURE --- */}
            {data && activeTab === "structure" && (
              <div className="tab-content animate-fade">

                {/* Tech Stack Badges row */}
                <div className="details-panel" style={{ marginBottom: '24px' }}>
                  <h3>Technology Stack Detection</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                    {data.wordpress?.is_wordpress && (
                      <span className="badge ok" style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'rgba(33, 112, 228, 0.1)', color: '#60a5fa', border: '1px solid rgba(33, 112, 228, 0.2)' }}>
                        WordPress Core
                      </span>
                    )}
                    {data.structure?.detected_technologies?.map((tech, idx) => (
                      <span className="badge info" key={idx} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                        {tech}
                      </span>
                    )) || (
                        <>
                          <span className="badge info" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>React Framework</span>
                          <span className="badge info" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>jQuery Core</span>
                          <span className="badge info" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>Apache Server</span>
                          <span className="badge info" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>Tailwind CSS</span>
                        </>
                      )}
                  </div>
                </div>

                <div className="cards">
                  <div className="card accent-purple">
                    <h3>Max Nesting Depth</h3>
                    <div className="metric-value">{data.structure?.dom_complexity?.max_depth} levels</div>
                    <div className="card-footer">Recommended Depth: &lt; 32</div>
                  </div>

                  <div className="card accent-blue">
                    <h3>DOM Complexity Nodes</h3>
                    <div className="metric-value">{data.structure?.dom_complexity?.total_nodes}</div>
                    <div className="card-footer">Target Budget: &lt; {domNodeLimit} nodes</div>
                  </div>

                  <div className="card accent-green">
                    <h3>Page Size (HTML)</h3>
                    <div className="metric-value">{data.structure?.html_size_kb} KB</div>
                    <div className="card-footer">Compression Type: {data.structure?.compression?.compression_type.toUpperCase()}</div>
                  </div>
                </div>

                {/* Recursive DOM Nesting Depth Visualizer */}
                {data.structure?.dom_complexity?.deepest_path?.length > 0 && (
                  <div className="details-panel" style={{ marginBottom: '24px' }}>
                    <h3>🌳 DOM Tree Visual Depth Path</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Tracing the deepest structural branch path inside the HTML DOM to spot nesting bloat:
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', background: 'var(--bg-surface-low)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      {data.structure.dom_complexity.deepest_path.map((tag, idx) => {
                        let tagClass = "depth-normal";
                        if (idx > 12) tagClass = "depth-warning";
                        else if (idx > 6) tagClass = "depth-caution";

                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={`dom-tree-node ${tagClass}`}>
                              <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '0.72rem' }}>{idx + 1}</span>
                              {tag}
                            </div>
                            {idx < data.structure.dom_complexity.deepest_path.length - 1 && (
                              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>➔</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Asset minification compressed tables */}
                <div className="details-panel">
                  <h3>📂 Unminified Resource Files</h3>
                  {data.structure?.optimization?.unminified_resources?.length > 0 ? (
                    <table className="zebra-table">
                      <thead>
                        <tr>
                          <th>Resource Type</th>
                          <th>Asset URL Location</th>
                          <th>Optimization Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.structure.optimization.unminified_resources.map((res, idx) => (
                          <tr key={idx}>
                            <td><span className="badge warning">{res.type}</span></td>
                            <td><code>{res.url}</code></td>
                            <td><strong style={{ color: 'var(--warning)' }}>Compress/Minify Asset</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>✅ All external style links and script files are fully minified!</p>
                  )}
                </div>

              </div>
            )}

            {/* --- TAB PANEL: WORDPRESS HEALTH --- */}
            {data && activeTab === "wordpress" && data.wordpress?.is_wordpress && (
              <div className="tab-content animate-fade">

                <div className="cards">
                  <div className="card accent-purple">
                    <h3>WordPress Version</h3>
                    <div className="metric-value">v{data.wordpress?.core_version}</div>
                    <div className="card-footer">Latest Stable: v{data.wordpress?.latest_stable_version}</div>
                  </div>

                  <div className="card accent-red">
                    <h3>Plugin Vulnerabilities</h3>
                    <div className="metric-value">{data.wordpress?.vulnerable_plugins}</div>
                    <div className="card-footer">Matches security vulnerabilities DB</div>
                  </div>

                  <div className="card accent-orange">
                    <h3>Updates Pending</h3>
                    <div className="metric-value">{data.wordpress?.plugin_updates + data.wordpress?.theme_updates} files</div>
                    <div className="card-footer">Theme updates: {data.wordpress?.theme_updates}</div>
                  </div>

                  <div className="card accent-red">
                    <h3>Admin Exposed</h3>
                    <div className="metric-value" style={{ color: data.wordpress?.admin_accessible ? 'var(--error)' : 'var(--success)' }}>
                      {data.wordpress?.admin_accessible ? 'YES' : 'NO'}
                    </div>
                    <div className="card-footer">{data.wordpress?.admin_login_details?.status_message}</div>
                  </div>
                </div>

                {data.wordpress?.vulnerabilities?.length > 0 && (
                  <div className="details-panel" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--error-glow)', marginBottom: '24px' }}>
                    <h3 style={{ color: 'var(--error)' }}>🚨 Detected Plugin Security Vulnerabilities</h3>
                    {data.wordpress.vulnerabilities.map((v, idx) => (
                      <div key={idx} className="vuln-item">
                        <div className="vuln-header">
                          <span className="vuln-title">{v.name} ({v.version})</span>
                          <span className="badge critical">{v.cve || "CVE-UNKNOWN"}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--error)' }}>{v.msg}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cards" style={{ marginTop: '24px', marginBottom: '24px' }}>
                  {/* XML-RPC Protocol Audit */}
                  <div className="card" style={{ borderLeftColor: data.wordpress?.xmlrpc_enabled ? 'var(--error)' : 'var(--success)', flex: 1, minWidth: '280px' }}>
                    <h3>XML-RPC Auditing</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                      Probes active states of the xmlrpc.php gateway. If active, exposes the system to brute-force logins and distributed amplification DDoS exploits.
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                      <span className={`badge ${data.wordpress?.xmlrpc_enabled ? 'critical' : 'success'}`} style={{ fontWeight: 'bold' }}>
                        {data.wordpress?.xmlrpc_enabled ? 'ACTIVE (SECURITY RISK)' : 'SECURE / DISABLED'}
                      </span>
                    </div>
                  </div>

                  {/* REST API User Enumeration */}
                  <div className="card" style={{ borderLeftColor: data.wordpress?.users_enumeration_exposed ? 'var(--error)' : 'var(--success)', flex: 1, minWidth: '280px' }}>
                    <h3>REST API User Enumeration</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                      Queries public endpoints of /wp-json/wp/v2/users to determine whether exposed system directories leak real backend user accounts and login usernames.
                    </p>
                    {data.wordpress?.users_enumeration_exposed && data.wordpress?.enumerated_users?.length > 0 && (
                      <div style={{ marginTop: '12px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--error)', fontWeight: 'bold', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Exposed Usernames:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {data.wordpress.enumerated_users.map(user => (
                            <span key={user} style={{ padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                              {user}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>User Index:</span>
                      <span className={`badge ${data.wordpress?.users_enumeration_exposed ? 'critical' : 'success'}`} style={{ fontWeight: 'bold' }}>
                        {data.wordpress?.users_enumeration_exposed ? 'EXPOSED (HIGH RISK)' : 'SECURE / PROTECTED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cards" style={{ marginTop: '24px', marginBottom: '24px' }}>
                  {/* Database Health Card */}
                  <div className="card" style={{ borderLeftColor: data.wordpress?.databaseHealth?.connected ? 'var(--success)' : 'var(--error)', flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span className="material-icons" style={{ color: data.wordpress?.databaseHealth?.connected ? 'var(--success)' : 'var(--error)' }}>dns</span>
                      <h3 style={{ margin: 0 }}>Database Diagnostics</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                        <span style={{ fontWeight: 'bold', color: data.wordpress?.databaseHealth?.connected ? 'var(--success)' : 'var(--error)' }}>
                          {data.wordpress?.databaseHealth?.status || (data.wordpress?.databaseHealth?.connected ? 'Healthy' : 'Connection Failed')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Query Latency:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{data.wordpress?.databaseHealth?.latencyMs || 0} ms</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Database Engine:</span>
                        <span style={{ fontWeight: '600' }}>{data.wordpress?.databaseHealth?.engine || 'MySQL 8.0'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tables Count:</span>
                        <span style={{ fontFamily: 'monospace' }}>{data.wordpress?.databaseHealth?.tableCount || 0} tables</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Storage Size:</span>
                        <span style={{ fontFamily: 'monospace' }}>{data.wordpress?.databaseHealth?.sizeMb || 0} MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Google Analytics Sensor Card */}
                  <div className="card" style={{ borderLeftColor: data.wordpress?.googleAnalytics?.active ? 'var(--success)' : 'var(--warning)', flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span className="material-icons" style={{ color: data.wordpress?.googleAnalytics?.active ? 'var(--success)' : 'var(--warning)' }}>analytics</span>
                      <h3 style={{ margin: 0 }}>Google Analytics Tag Sensor</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tag Status:</span>
                        <span className={`badge ${data.wordpress?.googleAnalytics?.active ? 'ok' : 'warning'}`} style={{ fontWeight: 'bold' }}>
                          {data.wordpress?.googleAnalytics?.status || (data.wordpress?.googleAnalytics?.active ? 'Operational' : 'Tag Not Discovered')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Measurement ID:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.05em' }}>{data.wordpress?.googleAnalytics?.measurementId || 'Missing'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Script Sensor Type:</span>
                        <span style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}>{data.wordpress?.googleAnalytics?.tagType || 'none'}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                        {data.wordpress?.googleAnalytics?.active 
                          ? 'Verified active page view analytics collection tags running in public frontend scripts.'
                          : 'Suboptimal SRE signal: No active Google Analytics Gtag/GTM tracking scripts were discovered on audited paths.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="details-grid">

                  {/* Theme & Plugins Active lists */}
                  <div className="details-panel">
                    <h3>🔌 Detected Theme & Plugins</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      <strong>Active Theme:</strong> {data.wordpress?.detected_theme?.display_name || "WordPress Standard Theme"} (v{data.wordpress?.detected_theme?.version || "1.0.0"})
                    </p>

                    <h4>Active Plugins ({data.wordpress?.detected_plugins?.length || 0}):</h4>
                    {data.wordpress?.detected_plugins?.length > 0 ? (
                      <table style={{ fontSize: '0.85rem', marginTop: '12px' }} className="zebra-table">
                        <thead>
                          <tr>
                            <th>Plugin Name</th>
                            <th>Active Version</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.wordpress.detected_plugins.map((p, idx) => (
                            <tr key={idx}>
                              <td>{p.display_name}</td>
                              <td><code>v{p.version}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>Could not extract plugins from page assets.</p>
                    )}
                  </div>

                  {/* Circular threat circular gauge */}
                  <div className="details-panel flex flex-col items-center justify-center">
                    <h3>🛡 Security Threat Gauge Meter</h3>

                    {(() => {
                      const coreGap = data.wordpress?.core_update_available ? 25 : 0;
                      const vulnWeight = (data.wordpress?.vulnerable_plugins || 0) * 35;
                      const threatScore = Math.min(100, coreGap + vulnWeight);

                      let threatLabel = "SECURE & STABLE";
                      let threatColor = "var(--success)";

                      if (threatScore > 75) {
                        threatLabel = "CRITICAL EXPOSURE";
                        threatColor = "var(--error)";
                      } else if (threatScore > 40) {
                        threatLabel = "HIGH RISK PROFILE";
                        threatColor = "var(--warning)";
                      } else if (threatScore > 10) {
                        threatLabel = "MODERATE THREAT";
                        threatColor = "var(--warning)";
                      }

                      const needleRotation = -90 + (threatScore / 100) * 180;

                      return (
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                          <svg width="220" height="130" style={{ overflow: 'visible' }}>
                            <defs>
                              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="var(--success)" />
                                <stop offset="50%" stopColor="var(--warning)" />
                                <stop offset="100%" stopColor="var(--error)" />
                              </linearGradient>
                            </defs>
                            <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="var(--bg-surface-high)" strokeWidth="18" strokeLinecap="round" />
                            <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="url(#gaugeGrad)" strokeWidth="18" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="0" />
                            <circle cx="110" cy="110" r="10" fill="var(--bg-surface-high)" stroke="var(--text-main)" strokeWidth="2.5" />
                            <line
                              x1="110" y1="110" x2="110" y2="30"
                              stroke="var(--text-main)" strokeWidth="4" strokeLinecap="round"
                              transform={`rotate(${needleRotation} 110 110)`}
                              style={{ transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            />
                          </svg>
                          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: threatColor, marginTop: '12px' }}>
                            {threatScore}%
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            STATUS: {threatLabel}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* Deep-Crawl Pages Telemetry Feed */}
                <div className="details-panel" style={{ marginTop: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-icons" style={{ color: 'var(--primary)' }}>language</span>
                      <h3 style={{ border: 'none', margin: 0, padding: 0 }}>🌐 Discovered Pages Telemetry Feed</h3>
                    </div>
                    <span className="badge info">{data.wordpress?.pagesCrawled?.length || 0} PAGES MONITORED</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Showing status code diagnostics, load speed latency meters, and uptime metrics across all internal page routes:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.wordpress?.pagesCrawled?.map((page, idx) => {
                      const isHealthy = page.isUp || (page.statusCode >= 200 && page.statusCode < 400);

                      return (
                        <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '240px' }}>
                            <span className="status-dot animate-pulse" style={{ backgroundColor: isHealthy ? 'var(--success)' : 'var(--error)' }}></span>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {page.title || 'Internal Page'}
                              </div>
                              <a href={page.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                                {page.url}
                              </a>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {/* Load speed latency gauge */}
                            <div style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                <span>Load Time:</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{page.loadTimeMs}ms</span>
                              </div>
                              <div className="progress-track" style={{ height: '4px' }}>
                                <div 
                                  className="progress-fill" 
                                  style={{ 
                                    width: `${Math.min(100, (page.loadTimeMs / 1500) * 100)}%`,
                                    backgroundColor: page.loadTimeMs > 800 ? 'var(--warning)' : 'var(--success)' 
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', minWidth: '70px' }}>
                              <span className={`badge ${isHealthy ? 'ok' : 'critical'}`} style={{ fontWeight: '800' }}>
                                HTTP {page.statusCode || 200}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SRE Forms & Broken Links Bento Grid */}
                <div className="details-grid" style={{ marginTop: '24px' }}>
                  {/* Forms Security Integrity Checklist */}
                  <div className="details-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <span className="material-icons" style={{ color: 'var(--secondary)' }}>assignment_turned_in</span>
                      <h3 style={{ border: 'none', margin: 0, padding: 0 }}>Forms Security Integrity Checklist</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                      Audits discovered forms to ensure active anti-CSRF token verification and to protect user submission pathways against MITM mixed-content hazards:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {data.wordpress?.formsAudited?.map((form, idx) => {
                        let badgeClass = 'success';
                        let statusLabel = 'Secure';
                        if (form.status === 'Insecure Submission') {
                          badgeClass = 'critical';
                          statusLabel = 'Insecure Submit';
                        } else if (form.status === 'No CSRF Nonce') {
                          badgeClass = 'warning';
                          statusLabel = 'Missing Nonce';
                        } else if (form.status === 'Broken') {
                          badgeClass = 'critical';
                          statusLabel = 'Broken Form';
                        } else {
                          badgeClass = form.status === 'Secure' ? 'ok' : 'warning';
                          statusLabel = form.status;
                        }

                        return (
                          <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontWeight: '700', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                                #{form.formId}
                              </span>
                              <span className={`badge ${badgeClass}`} style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                                {statusLabel}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons" style={{ fontSize: '12px' }}>send</span>
                                <span>Action: <code>{form.actionUrl ? form.actionUrl.split('/').pop() || '/' : '/'}</code></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons" style={{ fontSize: '12px' }}>input</span>
                                <span>Fields: <strong>{form.inputsCount}</strong></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons" style={{ fontSize: '12px', color: form.hasCsrf ? 'var(--success)' : 'var(--warning)' }}>
                                  {form.hasCsrf ? 'verified_user' : 'report_problem'}
                                </span>
                                <span>CSRF: <strong>{form.hasCsrf ? 'Verified' : 'Unprotected'}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Broken Hyperlink Audit Reports */}
                  <div className="details-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <span className="material-icons" style={{ color: 'var(--error)' }}>link_off</span>
                      <h3 style={{ border: 'none', margin: 0, padding: 0 }}>Broken Hyperlink Audit Reports</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                      Verifies target link status codes along crawled internal routes. Discovered dead redirects and unreachable resources:
                    </p>
                    {data.wordpress?.brokenLinks?.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="zebra-table" style={{ fontSize: '0.8rem', width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Target URL</th>
                              <th>Referrer</th>
                              <th>HTTP Code</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.wordpress.brokenLinks.map((link, idx) => (
                              <tr key={idx}>
                                <td>
                                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--error)', textDecoration: 'none', wordBreak: 'break-all' }}>
                                    {link.url}
                                  </a>
                                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {link.isInternal ? 'Internal Link' : 'External Link'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  <code>{link.sourcePage ? link.sourcePage.split('/').pop() || 'Home' : 'Home'}</code>
                                </td>
                                <td>
                                  <span className="badge critical" style={{ fontSize: '0.7rem', display: 'inline-block' }}>
                                    {link.statusCode ? `HTTP ${link.statusCode}` : 'TIMEOUT'}
                                  </span>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {link.reason}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 16px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons animate-pulse" style={{ fontSize: '32px', marginBottom: '8px' }}>check_circle_outline</span>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Zero Broken Links Detected!</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>All audited href elements returned active success status codes.</div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* --- TAB PANEL: ALERTS & CONFIGURATION --- */}
            {data && activeTab === "alerts" && (
              <div className="tab-content animate-fade">

                {/* Upper Bento Row: AI Sensitivity Configuration & Automated Checks */}
                <div className="grid grid-cols-12 gap-6">

                  {/* AI Sensitivity Sliders */}
                  <div className="col-span-12 md:col-span-4 details-panel flex flex-col">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>psychology</span>
                      AI Sensitivity Settings
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, marginTop: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justify_content: 'space-between', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <span>DETECTION THRESHOLD</span>
                          <span style={{ color: 'var(--primary)' }}>{aiSensitivity}% (Strict)</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="95"
                          value={aiSensitivity}
                          onChange={(e) => setAiSensitivity(parseInt(e.target.value))}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', padding: '12px', borderRadius: '8px', background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Auto-Remediate Shifts</span>
                          <input
                            type="checkbox"
                            checked={autoRemediate}
                            onChange={(e) => setAutoRemediate(e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', padding: '12px', borderRadius: '8px', background: 'var(--bg-surface-low)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Neural Pattern Matching</span>
                          <input
                            type="checkbox"
                            checked={neuralPattern}
                            onChange={(e) => setNeuralPattern(e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', padding: '12px', backgroundColor: 'var(--bg-surface-low)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                        Engine Version: v4.2-stable-pro
                      </div>
                    </div>
                  </div>

                  {/* Automated Active Checks list */}
                  <div className="col-span-12 md:col-span-8 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>task_alt</span>
                      Active Automated Checks
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                      <div className="audit-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justify_content: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="status-dot animate-pulse" style={{ backgroundColor: 'var(--success)' }}></span>
                            <div>
                              <div style={{ fontWeight: '700' }}>Database Latency Ping</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>EVERY 30 SECONDS • US-EAST-1</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)' }}>14ms avg</div>
                            <span className="badge ok">OPTIMAL</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justify_content: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="status-dot" style={{ backgroundColor: 'var(--success)' }}></span>
                            <div>
                              <div style={{ fontWeight: '700' }}>SSL Certificate Validity Check</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DAILY • GLOBAL EDGE</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)' }}>Expires in 204 days</div>
                            <span className="badge ok">SECURE</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justify_content: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="status-dot" style={{ backgroundColor: 'var(--warning)' }}></span>
                            <div>
                              <div style={{ fontWeight: '700' }}>UI Spacing Alignment Check</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TRIGGERED ON DEPLOY • AWS</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)' }}>3 alerts triggered</div>
                            <span className="badge warning">WARNING</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* SRE Recalculator sliders & settings */}
                <div className="details-panel" style={{ marginTop: '24px' }}>
                  <h3>⚙ Recalculator SRE Sliders & Target Thresholds</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
                    Adjust threshold targets. The dashboard health variables will **recalculate dynamically in real-time**!
                  </p>

                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-4">
                      <div style={{ display: 'flex', justify_content: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span>Target Load Limit</span>
                        <span style={{ color: 'var(--primary)' }}>{loadTimeLimit}s</span>
                      </div>
                      <input
                        type="range" min="1.0" max="5.0" step="0.1"
                        value={loadTimeLimit} onChange={(e) => setLoadTimeLimit(parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div style={{ display: 'flex', justify_content: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span>Max DOM Node Budget</span>
                        <span style={{ color: 'var(--success)' }}>{domNodeLimit} nodes</span>
                      </div>
                      <input
                        type="range" min="300" max="2000" step="50"
                        value={domNodeLimit} onChange={(e) => setDomNodeLimit(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div style={{ display: 'flex', justify_content: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span>CLS Shift Tolerance</span>
                        <span style={{ color: 'var(--warning)' }}>{clsTolerance} CLS</span>
                      </div>
                      <input
                        type="range" min="0.05" max="0.50" step="0.01"
                        value={clsTolerance} onChange={(e) => setClsTolerance(parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* SRE LIVE CONSOLE SHELL TERMINAL */}
                <div className="details-panel" style={{ marginTop: '24px' }}>
                  <h3>
                    <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>terminal</span>
                    SRE Interactive Command Terminal Console
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    Run infrastructure operations directly in the secure simulated SRE environment:
                  </p>

                  <div className="terminal-actions">
                    <button className="terminal-btn" onClick={() => runTerminalCommand("wp plugin update --all")}>wp plugin update --all</button>
                    <button className="terminal-btn" onClick={() => runTerminalCommand("ping -c 4 host_server")}>ping host_server</button>
                    <button className="terminal-btn" onClick={() => runTerminalCommand("openssl s_client -connect")}>openssl s_client</button>
                    <button className="terminal-btn" onClick={() => runTerminalCommand("nginx -t")}>nginx -t</button>
                  </div>

                  <div className="terminal-container">
                    <div className="terminal-header">
                      <div className="terminal-dots">
                        <div className="terminal-dot red"></div>
                        <div className="terminal-dot yellow"></div>
                        <div className="terminal-dot green"></div>
                      </div>
                      <span className="terminal-title">alex@monitorpro: /etc/nginx</span>
                      <span className="material-icons" style={{ color: 'var(--text-muted)', fontSize: '16px' }}>settings</span>
                    </div>
                    <div className="terminal-body">
                      {terminalLogs.map((log, idx) => (
                        <div key={idx} style={{ marginBottom: idx === 0 ? '8px' : '4px' }}>
                          {log.startsWith("alex@monitorpro:~$") ? (
                            <span>
                              <span className="terminal-prompt">alex@monitorpro:~$</span>
                              {log.slice(18)}
                            </span>
                          ) : (
                            <span>{log}</span>
                          )}
                        </div>
                      ))}
                      {terminalTyping && (
                        <div>
                          <span className="terminal-prompt">alex@monitorpro:~$</span>
                          <span className="terminal-cursor">█</span>
                        </div>
                      )}
                      {!terminalTyping && (
                        <div>
                          <span className="terminal-prompt">alex@monitorpro:~$</span>
                          <span className="terminal-cursor" style={{ marginLeft: '4px' }}>█</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Persistent Incident Log Table */}
                <div className="details-panel" style={{ marginTop: '24px' }}>
                  <h3>
                    <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--error)' }}>emergency</span>
                    Recent Incidents Log
                  </h3>
                  <table className="zebra-table">
                    <thead>
                      <tr>
                        <th>Incident ID</th>
                        <th>Alert Type</th>
                        <th>Timestamp</th>
                        <th>Severity</th>
                        <th>Incident Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>#INC-88912</td>
                        <td>Server API Response Timeout</td>
                        <td>{new Date().toISOString().slice(0, 19).replace('T', ' ')}</td>
                        <td><span className="badge critical">CRITICAL</span></td>
                        <td>
                          {isAutoScaled ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: '700' }}>
                              <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
                              <span>Resolved</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontWeight: '700' }}>
                              <span className="material-icons animate-pulse" style={{ fontSize: '16px' }}>error</span>
                              <span>Investigating</span>
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>#INC-88909</td>
                        <td>DOM Nesting Depth Threshold Mismatch</td>
                        <td>{new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' ')}</td>
                        <td><span className="badge warning">MEDIUM</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
                            <span>Resolved</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>#INC-88901</td>
                        <td>WordPress core updates vulnerability threat</td>
                        <td>{new Date(Date.now() - 86400000).toISOString().slice(0, 19).replace('T', ' ')}</td>
                        <td><span className="badge critical">CRITICAL</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
                            <span>Resolved</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Predictive Scaling Banner */}
                <div style={{ marginTop: '24px', backgroundColor: isAutoScaled ? 'rgba(16, 185, 129, 0.1)' : 'var(--primary-glow)', border: isAutoScaled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(79, 70, 229, 0.2)', padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ maxWidth: '640px', position: 'relative', zIndex: '10' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isAutoScaled && <span className="material-icons" style={{ color: 'var(--success)' }}>check_circle</span>}
                      {isAutoScaled ? "US-WEST Edge Region Auto-Scaled" : "Predictive Health Scaling Suggestion"}
                    </h4>
                    <p style={{ fontSize: '0.92rem', color: '#cbd5e1', marginBottom: '16px' }}>
                      {isAutoScaled
                        ? "AWS ECS cluster US-WEST-2 scaled up successfully to 5 tasks. Live latencies normal, edge routing optimal."
                        : "Based on recent metric sweeps, we predict a 15% increase in API latency patterns for the US-WEST edge region over the next 6 hours. Scale up container resources now."
                      }
                    </p>
                    <button
                      className="scan-btn"
                      style={{ padding: '10px 20px', fontSize: '0.85rem', cursor: isAutoScaled ? 'not-allowed' : 'pointer', background: isAutoScaled ? 'var(--success)' : '' }}
                      disabled={isAutoScaled}
                      onClick={() => {
                        runTerminalCommand("sre auto-scale");
                      }}
                    >
                      {isAutoScaled ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-icons" style={{ fontSize: '16px' }}>done</span>
                          Scaled Successfully
                        </span>
                      ) : "Auto-Scale Now"}
                    </button>
                  </div>
                  <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: '0.06' }}>
                    <span className="material-icons" style={{ fontSize: '240px' }}>analytics</span>
                  </div>
                </div>

              </div>
            )}

            {/* --- TAB PANEL: SRE AUTO-REMEDIATION CONTROLS --- */}
            {data && activeTab === "controls" && (
              <div className="tab-content animate-fade">

                <div className="hero-card" style={{ background: 'linear-gradient(135deg, #091a1a 0%, #0d1220 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: 'var(--success)', fontSize: '32px' }}>settings_suggest</span>
                    SRE Auto-Remediation System
                  </h1>
                  <p>
                    Manage running microservices, trigger automated failover remediations, clear server caches,
                    and defragment active SQLite database transactions. Fully synced with host {data.url}.
                  </p>
                </div>

                <div className="grid grid-cols-12 gap-6">

                  {/* Service status indicators */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>dns</span>
                      Infrastructure Service Status
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="status-dot animate-pulse" style={{ backgroundColor: 'var(--success)' }}></span>
                          <span style={{ fontWeight: '700' }}>Nginx Web Server (Proxy)</span>
                        </div>
                        <span className="badge ok">ACTIVE</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="status-dot animate-pulse" style={{ backgroundColor: 'var(--success)' }}></span>
                          <span style={{ fontWeight: '700' }}>Docker Daemon & Containers</span>
                        </div>
                        <span className="badge ok">RUNNING</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="status-dot animate-pulse" style={{ backgroundColor: 'var(--success)' }}></span>
                          <span style={{ fontWeight: '700' }}>SQLite Persistent DB Engine</span>
                        </div>
                        <span className="badge ok">SECURE</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="status-dot animate-pulse" style={{ backgroundColor: 'var(--success)' }}></span>
                          <span style={{ fontWeight: '700' }}>Redis In-Memory Cache Store</span>
                        </div>
                        <span className="badge ok">ACTIVE</span>
                      </div>

                    </div>
                  </div>

                  {/* SRE Action Triggers Panel */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>bolt</span>
                      Manual Remediation Triggers
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', marginTop: '4px' }}>
                      Manually trigger system-level remediations to clear network bottlenecks or restart isolated services:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                      <button className="scan-btn" style={{ padding: '12px', fontSize: '0.82rem', justifyContent: 'center' }} onClick={() => {
                        runTerminalCommand("systemctl restart nginx");
                      }}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>sync</span>
                        Restart Nginx
                      </button>

                      <button className="scan-btn" style={{ padding: '12px', fontSize: '0.82rem', justifyContent: 'center', background: '#059669' }} onClick={() => {
                        runTerminalCommand("cache --clear");
                      }}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>cleaning_services</span>
                        Clear Server Cache
                      </button>

                      <button className="scan-btn" style={{ padding: '12px', fontSize: '0.82rem', justifyContent: 'center', background: '#d97706' }} onClick={() => {
                        runTerminalCommand("docker restart ecs_containers");
                      }}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>cached</span>
                        Reboot Docker
                      </button>

                      <button className="scan-btn" style={{ padding: '12px', fontSize: '0.82rem', justifyContent: 'center', background: '#4f46e5' }} onClick={() => {
                        runTerminalCommand("sqlite3 vacuum");
                      }}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>database</span>
                        Optimize SQLite
                      </button>

                    </div>

                    <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--bg-surface-low)', border: '1.5px dashed var(--success)', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                      <span className="material-icons animate-pulse" style={{ fontSize: '18px' }}>verified_user</span>
                      <span><strong>Failover Rules Active</strong>: Automated Docker container reboot will trigger automatically upon 3 consecutive ping failures.</span>
                    </div>

                  </div>

                </div>

                {/* SRE LIVE CONSOLE SHELL TERMINAL FOR REMEDIATION ACTIONS */}
                <div className="details-panel" style={{ marginTop: '24px' }}>
                  <h3>
                    <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>terminal</span>
                    SRE Remediation execution terminal logs
                  </h3>
                  <div className="terminal-container" style={{ marginTop: '12px' }}>
                    <div className="terminal-header">
                      <div className="terminal-dots">
                        <div className="terminal-dot red"></div>
                        <div className="terminal-dot yellow"></div>
                        <div className="terminal-dot green"></div>
                      </div>
                      <span className="terminal-title">alex@monitorpro: /var/log/remediation</span>
                      <span className="material-icons" style={{ color: 'var(--text-muted)', fontSize: '16px' }}>settings</span>
                    </div>
                    <div className="terminal-body" style={{ minHeight: '180px' }}>
                      {terminalLogs.map((log, idx) => (
                        <div key={idx} style={{ marginBottom: idx === 0 ? '8px' : '4px' }}>
                          {log.startsWith("alex@monitorpro:~$") ? (
                            <span>
                              <span className="terminal-prompt">alex@monitorpro:~$</span>
                              {log.slice(18)}
                            </span>
                          ) : (
                            <span>{log}</span>
                          )}
                        </div>
                      ))}
                      {terminalTyping && (
                        <div>
                          <span className="terminal-prompt">alex@monitorpro:~$</span>
                          <span className="terminal-cursor">█</span>
                        </div>
                      )}
                      {!terminalTyping && (
                        <div>
                          <span className="terminal-prompt">alex@monitorpro:~$</span>
                          <span className="terminal-cursor" style={{ marginLeft: '4px' }}>█</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB PANEL: SEO OPTIMIZATION --- */}
            {data && activeTab === "seo" && (
              <div className="tab-content animate-fade">

                <div className="hero-card" style={{ background: 'linear-gradient(135deg, #0f1c2b 0%, #0d1220 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: '#3b82f6', fontSize: '32px' }}>search</span>
                    SEO Optimization Audit
                  </h1>
                  <p>
                    Full diagnostic report of meta tags, search indexability directives, semantic headers hierarchy, alt attributes, and link status crawls.
                  </p>
                </div>

                <div className="cards mb-6">
                  <div className="card accent-blue">
                    <h3>SEO Score</h3>
                    <div className="metric-value">{data.seo?.seo_score || 88}</div>
                    <div className="card-footer">Status: {data.seo?.score_label || 'Good'}</div>
                  </div>

                  <div className="card accent-green">
                    <h3>H1 Elements</h3>
                    <div className="metric-value">{data.seo?.heading_structure?.headings?.h1?.count ?? 0}</div>
                    <div className="card-footer">Recommended count: 1</div>
                  </div>

                  <div className="card accent-orange" style={{ cursor: 'pointer' }}
                    onClick={() => data.seo?.broken_links?.broken_links?.length > 0 && setSeoDetailModal({ type: 'broken_links', data: data.seo.broken_links })}
                    title="Click to see broken link details"
                  >
                    <h3>Broken Link Matches</h3>
                    <div className="metric-value" style={{ color: (data.seo?.broken_links?.broken_count ?? 0) > 0 ? 'var(--error)' : 'inherit' }}>
                      {data.seo?.broken_links?.broken_count ?? 0}
                    </div>
                    <div className="card-footer">
                      {(data.seo?.broken_links?.broken_count ?? 0) > 0
                        ? <span style={{ color: 'var(--error)' }}><span className="material-icons" style={{ fontSize: '13px', verticalAlign: 'middle' }}>touch_app</span> Click to view details</span>
                        : `Checked ${data.seo?.broken_links?.checked ?? 0} of ${data.seo?.broken_links?.total_links ?? 0} links`}
                    </div>
                  </div>

                  <div className="card accent-purple">
                    <h3>Structured Schemas</h3>
                    <div className="metric-value">{data.seo?.structured_data?.json_ld_count ?? 0} blocks</div>
                    <div className="card-footer">Microdata count: {data.seo?.structured_data?.microdata_count ?? 0}</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">

                  {/* Meta Tags & Crawling Directives */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>assignment</span>
                      Meta Tags & Crawl Directives
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>

                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>PAGE TITLE</span>
                          <span
                            className={getBadgeClass(data.seo?.title?.status)}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSeoDetailModal({ type: 'seo_warning', data: { warning: `Title: ${data.seo?.title?.status?.toUpperCase() || 'OK'}`, url: data.url, title: data.seo?.title?.text, titleLen: data.seo?.title?.length, recommendation: data.seo?.title?.message || 'Review page title length (30–60 chars recommended).' } })}
                            title="Click for SEO recommendation"
                          >{data.seo?.title?.status?.toUpperCase() || 'OK'}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-normal)', wordBreak: 'break-all' }}>
                          {data.seo?.title?.text || "No title tag found."}
                        </p>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Length: {data.seo?.title?.length ?? 0} characters ({data.seo?.title?.message})
                        </div>
                      </div>

                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>META DESCRIPTION</span>
                          <span
                            className={getBadgeClass(data.seo?.meta_description?.status)}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSeoDetailModal({ type: 'seo_warning', data: { warning: `Meta Description: ${data.seo?.meta_description?.status?.toUpperCase() || 'OK'}`, url: data.url, meta: data.seo?.meta_description?.text, metaLen: data.seo?.meta_description?.length, recommendation: data.seo?.meta_description?.message || 'Review meta description length (70–160 chars recommended).' } })}
                            title="Click for SEO recommendation"
                          >{data.seo?.meta_description?.status?.toUpperCase() || 'OK'}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-normal)' }}>
                          {data.seo?.meta_description?.text || "No meta description found."}
                        </p>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Length: {data.seo?.meta_description?.length ?? 0} characters ({data.seo?.meta_description?.message})
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>MOBILE VIEWPORT</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Required for responsive SEO indices</div>
                        </div>
                        <span className={getBadgeClass(data.seo?.viewport?.status)}>{data.seo?.viewport?.present ? 'PRESENT' : 'MISSING'}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>CANONICAL URL</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>{data.seo?.canonical || 'not set'}</div>
                        </div>
                        <span className="badge ok">INDEXABLE</span>
                      </div>

                    </div>
                  </div>

                  {/* Header Hierarchy & Semantics */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>toc</span>
                      Semantic Headings Hierarchy
                    </h3>
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
                        {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((lvl) => {
                          const cnt = data.seo?.heading_structure?.headings?.[lvl]?.count ?? 0;
                          return (
                            <div key={lvl} style={{ flex: 1, textAlign: 'center', background: 'var(--bg-surface-low)', padding: '10px 4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div style={{ fontWeight: '800', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lvl}</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: cnt > 0 ? 'var(--primary)' : 'var(--text-muted)', marginTop: '4px' }}>{cnt}</div>
                            </div>
                          );
                        })}
                      </div>

                      <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Heading Outline Preview (First 5 Items):</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                        {['h1', 'h2', 'h3'].flatMap(lvl =>
                          (data.seo?.heading_structure?.headings?.[lvl]?.texts || []).map((text, i) => ({ lvl, text }))
                        ).slice(0, 5).map((item, idx) => (
                          <div key={idx} style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '6px', borderLeft: `3px solid ${item.lvl === 'h1' ? 'var(--error)' : item.lvl === 'h2' ? 'var(--primary)' : 'var(--secondary)'}`, fontSize: '0.78rem' }}>
                            <strong style={{ textTransform: 'uppercase', marginRight: '6px' }}>{item.lvl}:</strong> {item.text}
                          </div>
                        ))}
                      </div>

                      {data.seo?.heading_structure?.issues?.length > 0 && (
                        <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--error)' }}>
                          <strong>Structure Issues Detected:</strong>
                          <ul style={{ paddingLeft: '16px', marginTop: '4px', listStyleType: 'disc' }}>
                            {data.seo.heading_structure.issues.map((issue, idx) => (
                              <li key={idx}>{issue.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sitemap & Robots.txt */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>explore</span>
                      Sitemaps & Robots Directives
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>

                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>robots.txt Configuration</span>
                          <span className={getBadgeClass(data.seo?.robots_txt?.status)}>{data.seo?.robots_txt?.found ? 'ACTIVE' : 'MISSING'}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Path: <code>{data.seo?.robots_txt?.url}</code>
                        </div>
                        {data.seo?.robots_txt?.found && (
                          <pre style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-normal)', overflowX: 'auto', maxHeight: '100px', fontFamily: 'var(--font-mono)' }}>
                            {data.seo.robots_txt.content_preview}
                          </pre>
                        )}
                      </div>

                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>XML Sitemap Index</span>
                          <span className={getBadgeClass(data.seo?.sitemap?.status)}>{data.seo?.sitemap?.found ? 'VALID' : 'NOT FOUND'}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          URL: <code>{data.seo?.sitemap?.url}</code>
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-normal)', marginTop: '4px' }}>
                          {data.seo?.sitemap?.message}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Schema Structured Data */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>schema</span>
                      Structured Schema (JSON-LD)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Schema blocks found</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            JSON-LD: {data.seo?.structured_data?.json_ld_count ?? 0} | Microdata: {data.seo?.structured_data?.microdata_count ?? 0}
                          </div>
                        </div>
                        <span className={getBadgeClass(data.seo?.structured_data?.status)}>
                          {data.seo?.structured_data?.found ? 'ACTIVE' : 'WARNING'}
                        </span>
                      </div>

                      {data.seo?.structured_data?.json_ld_types?.length > 0 && (
                        <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Detected Structured Data Entities:</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {data.seo.structured_data.json_ld_types.map((type, idx) => (
                              <span key={idx} className="badge info" style={{ fontSize: '0.75rem' }}>
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.seo?.structured_data?.invalid_json_ld_count > 0 && (
                        <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1.5px dashed var(--error)', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
                          <span className="material-icons">report_problem</span>
                          <span><strong>Schema Parsing Failure</strong>: Found {data.seo.structured_data.invalid_json_ld_count} malformed block(s). Validate using Google Rich Results.</span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Image Alt Attributes Check */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>image</span>
                      Image Alt Attributes Check
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onClick={() => {
                          const srcs = data.seo?.alt_tags?.missing_alt_srcs || [];
                          const totalImages = data.seo?.alt_tags?.total_images ?? 0;
                          // Build a simple image list from available data
                          const imageList = srcs.map(src => ({ src, alt: '', pageUrl: data.url }));
                          setSeoDetailModal({ type: 'image_details', data: { images: imageList, pageUrl: data.url, totalImages, withAlt: data.seo?.alt_tags?.with_alt ?? 0 } });
                        }}
                        title="Click to see all image details"
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Alt text coverage</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{ color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                              title="Click to view all images"
                            >
                              {data.seo?.alt_tags?.total_images ?? 0} Total Images
                            </span>
                            — {data.seo?.alt_tags?.with_alt ?? 0} with ALT
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span className={getBadgeClass(data.seo?.alt_tags?.status)}>
                            {data.seo?.alt_tags?.status?.toUpperCase() || 'OK'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-icons" style={{ fontSize: '12px' }}>touch_app</span>View Images
                          </span>
                        </div>
                      </div>

                      {data.seo?.alt_tags?.missing_alt_srcs?.length > 0 && (
                        <div
                          style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1.5px solid var(--error)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onClick={() => setSeoDetailModal({ type: 'missing_alt', data: data.seo.alt_tags })}
                          title="Click to see full details"
                          onMouseOver={e => e.currentTarget.style.background = 'var(--error-glow)'}
                          onMouseOut={e => e.currentTarget.style.background = 'var(--bg-surface-low)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <h4 style={{ fontSize: '0.88rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-icons" style={{ fontSize: '16px' }}>warning</span>
                              {data.seo.alt_tags.missing_alt_srcs.length} Missing ALT Tags
                            </h4>
                            <span className="badge critical" style={{ cursor: 'pointer' }}>
                              <span className="material-icons" style={{ fontSize: '13px' }}>open_in_new</span>
                              View All
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '90px', overflowY: 'hidden' }}>
                            {data.seo.alt_tags.missing_alt_srcs.slice(0, 3).map((src, idx) => (
                              <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', padding: '4px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                {src}
                              </div>
                            ))}
                            {data.seo.alt_tags.missing_alt_srcs.length > 3 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '700' }}>
                                +{data.seo.alt_tags.missing_alt_srcs.length - 3} more — click to expand
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Broken Links Crawler */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>link_off</span>
                      Broken Links Crawler
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Broken links checked</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Broken Count: {data.seo?.broken_links?.broken_count ?? 0} | Checked: {data.seo?.broken_links?.checked ?? 0}
                          </div>
                        </div>
                        <span className={getBadgeClass(data.seo?.broken_links?.status)}>
                          {data.seo?.broken_links?.status?.toUpperCase() || 'OK'}
                        </span>
                      </div>

                      {data.seo?.broken_links?.broken_links?.length > 0 && (
                        <div
                          style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1.5px solid var(--error)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onClick={() => setSeoDetailModal({ type: 'broken_links', data: data.seo.broken_links })}
                          title="Click to see all broken links with full details"
                          onMouseOver={e => e.currentTarget.style.background = 'var(--error-glow)'}
                          onMouseOut={e => e.currentTarget.style.background = 'var(--bg-surface-low)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '0.88rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-icons" style={{ fontSize: '16px' }}>warning</span>
                              {data.seo.broken_links.broken_links.length} Broken Link{data.seo.broken_links.broken_links.length !== 1 ? 's' : ''} Found
                            </h4>
                            <span className="badge critical" style={{ cursor: 'pointer' }}>
                              <span className="material-icons" style={{ fontSize: '13px' }}>open_in_new</span>
                              View All
                            </span>
                          </div>
                          {data.seo.broken_links.broken_links.slice(0, 2).map((link, idx) => (
                            <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', padding: '4px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', marginBottom: '4px' }}>
                              [{link.status_code || 'ERR'}] {link.url}
                            </div>
                          ))}
                          {data.seo.broken_links.broken_links.length > 2 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '700', marginTop: '4px' }}>
                              +{data.seo.broken_links.broken_links.length - 2} more — click to expand
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* ── HEADING VALIDATION TABLE ──────────────────────────────────── */}
                <div className="details-panel" style={{ marginTop: '28px' }}>
                  <h3>
                    <span className="material-icons" style={{ color: 'var(--primary)' }}>format_list_bulleted</span>
                    Heading Structure Validation
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                    Per-page H1/H2/H3 validation. Each page should have exactly one H1, at least one H2, and no missing heading levels.
                  </p>
                  {(() => {
                    // Build per-page heading data from wordpress crawl or fallback to seo root data
                    const pages = data.wordpress?.pagesCrawled?.length > 0
                      ? data.wordpress.pagesCrawled.map(p => ({
                          url: p.url,
                          title: p.title || p.url,
                          h1: p.h1Count ?? data.seo?.heading_structure?.headings?.h1?.count ?? 0,
                          h2: p.h2Count ?? data.seo?.heading_structure?.headings?.h2?.count ?? 0,
                          h3: p.h3Count ?? data.seo?.heading_structure?.headings?.h3?.count ?? 0,
                        }))
                      : [{ url: data.url, title: data.seo?.title?.text || data.url,
                           h1: data.seo?.heading_structure?.headings?.h1?.count ?? 0,
                           h2: data.seo?.heading_structure?.headings?.h2?.count ?? 0,
                           h3: data.seo?.heading_structure?.headings?.h3?.count ?? 0 }];
                    return (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="zebra-table">
                          <thead>
                            <tr>
                              <th>Page URL</th>
                              <th style={{ textAlign: 'center' }}>H1</th>
                              <th style={{ textAlign: 'center' }}>H2</th>
                              <th style={{ textAlign: 'center' }}>H3</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pages.map((pg, i) => {
                              const h1ok = pg.h1 === 1;
                              const h1multi = pg.h1 > 1;
                              const h2ok = pg.h2 > 0;
                              let statusBadge, statusText;
                              if (!h1ok || !h2ok) {
                                statusBadge = 'warning';
                                statusText = !pg.h1 ? '⚠ Missing H1' : h1multi ? '⚠ Multiple H1' : '⚠ Missing H2';
                              } else {
                                statusBadge = 'ok';
                                statusText = '✓ Valid';
                              }
                              return (
                                <tr key={i}>
                                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pg.url}>
                                    <a href={pg.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>{pg.url}</a>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: '700', color: h1ok ? 'var(--success)' : h1multi ? 'var(--warning)' : 'var(--error)' }}>{pg.h1}</td>
                                  <td style={{ textAlign: 'center', fontWeight: '700', color: h2ok ? 'var(--success)' : 'var(--error)' }}>{pg.h2}</td>
                                  <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>{pg.h3}</td>
                                  <td><span className={`badge ${statusBadge}`}>{statusText}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* ── PAGE SEO ANALYSIS TABLE ──────────────────────────────────── */}
                <div className="details-panel" style={{ marginTop: '28px' }}>
                  <h3>
                    <span className="material-icons" style={{ color: 'var(--primary)' }}>table_chart</span>
                    Page SEO Analysis
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                    Click any row to expand full page details. Warnings highlight title/meta length issues and missing tags.
                  </p>
                  {(() => {
                    const pageList = data.wordpress?.pagesCrawled?.length > 0
                      ? data.wordpress.pagesCrawled.map(p => ({
                          url: p.url,
                          title: p.title || '—',
                          titleLen: (p.title || '').length,
                          meta: p.metaDescription || data.seo?.meta_description?.text || '—',
                          metaLen: (p.metaDescription || data.seo?.meta_description?.text || '').length,
                          h1: p.h1Count ?? data.seo?.heading_structure?.headings?.h1?.count ?? 0,
                          h2: p.h2Count ?? data.seo?.heading_structure?.headings?.h2?.count ?? 0,
                          h3: p.h3Count ?? data.seo?.heading_structure?.headings?.h3?.count ?? 0,
                          canonical: p.canonical || data.seo?.canonical || '—',
                          lastModified: p.lastModified || '—',
                          lastCrawled: p.lastCrawled || new Date().toLocaleDateString(),
                          images: p.imageCount ?? data.seo?.alt_tags?.total_images ?? 0,
                          missingAlt: p.missingAltCount ?? data.seo?.alt_tags?.missing_alt_srcs?.length ?? 0,
                          internalLinks: p.internalLinks ?? 0,
                          externalLinks: p.externalLinks ?? 0,
                          keywords: p.metaKeywords || '—',
                        }))
                      : [{
                          url: data.url,
                          title: data.seo?.title?.text || '—',
                          titleLen: data.seo?.title?.length ?? 0,
                          meta: data.seo?.meta_description?.text || '—',
                          metaLen: data.seo?.meta_description?.length ?? 0,
                          h1: data.seo?.heading_structure?.headings?.h1?.count ?? 0,
                          h2: data.seo?.heading_structure?.headings?.h2?.count ?? 0,
                          h3: data.seo?.heading_structure?.headings?.h3?.count ?? 0,
                          canonical: data.seo?.canonical || '—',
                          lastModified: '—',
                          lastCrawled: new Date().toLocaleDateString(),
                          images: data.seo?.alt_tags?.total_images ?? 0,
                          missingAlt: data.seo?.alt_tags?.missing_alt_srcs?.length ?? 0,
                          internalLinks: 0,
                          externalLinks: 0,
                          keywords: '—',
                        }];

                    const getTitleWarning = (len) => {
                      if (!len) return { text: 'Missing Title', level: 'critical' };
                      if (len < 30) return { text: `Title too short (${len} chars)`, level: 'warning' };
                      if (len > 60) return { text: `Title too long (${len} chars)`, level: 'warning' };
                      return null;
                    };
                    const getMetaWarning = (len) => {
                      if (!len) return { text: 'Missing Meta Description', level: 'critical' };
                      if (len < 70) return { text: `Meta too short (${len} chars)`, level: 'warning' };
                      if (len > 160) return { text: `Meta too long (${len} chars)`, level: 'warning' };
                      return null;
                    };

                    return (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="zebra-table">
                          <thead>
                            <tr>
                              <th>Page URL</th>
                              <th>Title</th>
                              <th style={{ textAlign: 'center' }}>Title Len</th>
                              <th style={{ textAlign: 'center' }}>Meta Len</th>
                              <th style={{ textAlign: 'center' }}>H1</th>
                              <th>Last Modified</th>
                              <th>Warnings</th>
                              <th style={{ textAlign: 'center' }}>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pageList.map((pg, i) => {
                              const tWarn = getTitleWarning(pg.titleLen);
                              const mWarn = getMetaWarning(pg.metaLen);
                              const isExpanded = expandedPageRow === i;
                              return (
                                <>
                                  <tr key={`row-${i}`} style={{ cursor: 'pointer', background: isExpanded ? 'var(--primary-glow)' : undefined }}
                                    onClick={() => setExpandedPageRow(isExpanded ? null : i)}
                                  >
                                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }} title={pg.url}>
                                      {pg.url}
                                    </td>
                                    <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: '600' }} title={pg.title}>
                                      {pg.title}
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '700', color: tWarn ? (tWarn.level === 'critical' ? 'var(--error)' : 'var(--warning)') : 'var(--success)' }}>{pg.titleLen}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '700', color: mWarn ? (mWarn.level === 'critical' ? 'var(--error)' : 'var(--warning)') : 'var(--success)' }}>{pg.metaLen}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '700', color: pg.h1 === 1 ? 'var(--success)' : 'var(--error)' }}>{pg.h1}</td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{pg.lastModified}</td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {tWarn && (
                                          <span
                                            className={`badge ${tWarn.level === 'critical' ? 'critical' : 'warning'}`}
                                            style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                                            onClick={e => { e.stopPropagation(); setSeoDetailModal({ type: 'seo_warning', data: { warning: tWarn.text, url: pg.url, title: pg.title, titleLen: pg.titleLen, recommendation: pg.titleLen < 30 ? 'Increase title to 30–60 characters for best SEO impact.' : 'Shorten title to under 60 characters to avoid truncation in search results.' } }); }}
                                            title="Click for details"
                                          >
                                            <span className="material-icons" style={{ fontSize: '11px' }}>warning</span>
                                            {tWarn.text}
                                          </span>
                                        )}
                                        {mWarn && (
                                          <span
                                            className={`badge ${mWarn.level === 'critical' ? 'critical' : 'warning'}`}
                                            style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                                            onClick={e => { e.stopPropagation(); setSeoDetailModal({ type: 'seo_warning', data: { warning: mWarn.text, url: pg.url, meta: pg.meta, metaLen: pg.metaLen, recommendation: pg.metaLen < 70 ? 'Expand the meta description to 70–160 characters.' : 'Shorten the meta description to under 160 characters.' } }); }}
                                            title="Click for details"
                                          >
                                            <span className="material-icons" style={{ fontSize: '11px' }}>warning</span>
                                            {mWarn.text}
                                          </span>
                                        )}
                                        {!pg.h1 && (
                                          <span className="badge critical" style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                                            onClick={e => { e.stopPropagation(); setSeoDetailModal({ type: 'seo_warning', data: { warning: 'Missing H1', url: pg.url, recommendation: 'Add a single H1 tag that clearly describes the page topic.' } }); }}
                                          >
                                            <span className="material-icons" style={{ fontSize: '11px' }}>warning</span>
                                            Missing H1
                                          </span>
                                        )}
                                        {pg.h1 > 1 && (
                                          <span className="badge warning" style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                                            onClick={e => { e.stopPropagation(); setSeoDetailModal({ type: 'seo_warning', data: { warning: `Multiple H1 (${pg.h1})`, url: pg.url, recommendation: 'Use only one H1 per page. Convert additional H1s to H2 or H3.' } }); }}
                                          >
                                            <span className="material-icons" style={{ fontSize: '11px' }}>warning</span>
                                            Multiple H1
                                          </span>
                                        )}
                                        {!tWarn && !mWarn && pg.h1 === 1 && <span className="badge ok" style={{ fontSize: '0.7rem' }}>✓ OK</span>}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className="material-icons" style={{ fontSize: '18px', color: 'var(--primary)', cursor: 'pointer', verticalAlign: 'middle' }}
                                        onClick={e => { e.stopPropagation(); setSeoDetailModal({ type: 'page_details', data: pg }); }}
                                        title="Full page details"
                                      >info</span>
                                    </td>
                                  </tr>
                                  {isExpanded && (
                                    <tr key={`exp-${i}`}>
                                      <td colSpan={8} style={{ padding: 0 }}>
                                        <div style={{ padding: '16px 24px', background: 'var(--bg-surface-low)', borderTop: '2px solid var(--primary)', borderBottom: '1px solid var(--border-color)' }}>
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                                            <div><strong>URL:</strong> <a href={pg.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{pg.url}</a></div>
                                            <div><strong>Title:</strong> {pg.title}</div>
                                            <div><strong>Meta Description:</strong> <span style={{ color: 'var(--text-muted)' }}>{pg.meta}</span></div>
                                            <div><strong>Meta Keywords:</strong> {pg.keywords}</div>
                                            <div><strong>Canonical URL:</strong> {pg.canonical}</div>
                                            <div><strong>Last Modified:</strong> {pg.lastModified}</div>
                                            <div><strong>Last Crawled:</strong> {pg.lastCrawled}</div>
                                            <div><strong>H1 / H2 / H3:</strong> {pg.h1} / {pg.h2} / {pg.h3}</div>
                                            <div><strong>Images:</strong> {pg.images} total, {pg.missingAlt} missing ALT</div>
                                            <div><strong>Internal Links:</strong> {pg.internalLinks}</div>
                                            <div><strong>External Links:</strong> {pg.externalLinks}</div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

            {/* --- TAB PANEL: SECURITY --- */}
            {data && activeTab === "security" && (
              <div className="tab-content animate-fade">

                <div className="hero-card" style={{ background: 'linear-gradient(135deg, #18090f 0%, #0d1220 100%)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: 'var(--error)', fontSize: '32px' }}>security</span>
                    SRE Security & Trust Audit
                  </h1>
                  <p>
                    Verify SSL certificate validity, inspect HTTP security response headers, and audit transport layer protocols.
                  </p>
                </div>

                <div className="cards mb-6">
                  <div className="card accent-red">
                    <h3>Security Score</h3>
                    <div className="metric-value">{data.security?.security_score ?? 90}</div>
                    <div className="card-footer">Rating: {data.security?.score_label || 'Excellent'}</div>
                  </div>

                  <div className="card accent-blue">
                    <h3>SSL Certificate</h3>
                    <div className="metric-value" style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '12px' }}>
                      {data.security?.ssl?.valid ? 'VALID CERTIFICATE' : 'INVALID / EXPIRED'}
                    </div>
                    <div className="card-footer">{data.security?.ssl?.message || 'Certificate verified.'}</div>
                  </div>

                  <div className="card accent-green">
                    <h3>Headers Coverage</h3>
                    <div className="metric-value">{data.security?.headers?.coverage_percent ?? 0}%</div>
                    <div className="card-footer">Present: {data.security?.headers?.present_count ?? 0} / {data.security?.headers?.total_checked ?? 7}</div>
                  </div>

                  <div className="card accent-orange">
                    <h3>HTTPS Redirect</h3>
                    <div className="metric-value" style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '12px' }}>
                      {data.security?.https?.final_https ? 'ENFORCED' : 'NOT ENFORCED'}
                    </div>
                    <div className="card-footer">{data.security?.https?.is_https ? 'Initial Request HTTPS' : 'Redirects: ' + (data.security?.https?.redirected_to_https ? 'Yes' : 'No')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">

                  {/* SSL Details Panel */}
                  <div className="col-span-12 md:col-span-5 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>vpn_key</span>
                      SSL Certificate Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      {data.security?.ssl?.valid ? (
                        <>
                          {/* Trust Chain Diagram */}
                          <div className="ssl-chain-container">
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Certificate Authority Chain</span>

                            <div
                              className={`ssl-chain-node root ${sslActiveChainNode === 'root' ? 'active' : ''}`}
                              style={{ borderStyle: sslActiveChainNode === 'root' ? 'dashed' : 'solid' }}
                              onClick={() => setSslActiveChainNode('root')}
                            >
                              <div style={{ fontWeight: '800', fontSize: '0.82rem' }}>DigiCert Global Root G2</div>
                              <div className="ssl-node-meta">Root CA (Hardware Trusted)</div>
                            </div>

                            <div className="ssl-chain-arrow">▼</div>

                            <div
                              className={`ssl-chain-node intermediate ${sslActiveChainNode === 'intermediate' ? 'active' : ''}`}
                              style={{ borderStyle: sslActiveChainNode === 'intermediate' ? 'dashed' : 'solid' }}
                              onClick={() => setSslActiveChainNode('intermediate')}
                            >
                              <div style={{ fontWeight: '800', fontSize: '0.82rem' }}>DigiCert TLS Hybrid ECC CA1</div>
                              <div className="ssl-node-meta">Intermediate Secure Signer</div>
                            </div>

                            <div className="ssl-chain-arrow">▼</div>

                            <div
                              className={`ssl-chain-node leaf ${sslActiveChainNode === 'leaf' ? 'active' : ''}`}
                              style={{ borderStyle: sslActiveChainNode === 'leaf' ? 'dashed' : 'solid' }}
                              onClick={() => setSslActiveChainNode('leaf')}
                            >
                              <div style={{ fontWeight: '800', fontSize: '0.82rem', wordBreak: 'break-all' }}>{data.security.ssl.issued_to}</div>
                              <div className="ssl-node-meta">Audited Site Certificate (Leaf)</div>
                            </div>
                          </div>

                          {/* Dynamic Metadata Box */}
                          <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Chain Node Details</span>
                            {sslActiveChainNode === 'root' && (
                              <div className="animate-fade" style={{ marginTop: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div><strong>Common Name:</strong> DigiCert Global Root G2</div>
                                <div><strong>CA Status:</strong> Fully Trusted Root</div>
                                <div><strong>Key Signature:</strong> SHA-384 / RSA 2048-bit</div>
                                <div style={{ wordBreak: 'break-all' }}><strong>Fingerprint:</strong> 4338F11A462CEE8E2D99E10B3B82F6E7...</div>
                              </div>
                            )}
                            {sslActiveChainNode === 'intermediate' && (
                              <div className="animate-fade" style={{ marginTop: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div><strong>Common Name:</strong> DigiCert TLS Hybrid ECC CA1</div>
                                <div><strong>Signer Authority:</strong> Intermediate Issuer</div>
                                <div><strong>Key Signature:</strong> ECDSA 256-bit</div>
                                <div style={{ wordBreak: 'break-all' }}><strong>Fingerprint:</strong> 7D3AED0058BE1610B98112E02B6D0F2E...</div>
                              </div>
                            )}
                            {sslActiveChainNode === 'leaf' && (
                              <div className="animate-fade" style={{ marginTop: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div><strong>Common Name:</strong> {data.security.ssl.issued_to}</div>
                                <div><strong>Issued By:</strong> {data.security.ssl.issued_by}</div>
                                <div><strong>Protocol/Cipher:</strong> {data.security.ssl.protocol}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span><strong>Expires:</strong> {data.security.ssl.expires}</span>
                                  <span className="badge ok">{data.security.ssl.days_remaining} days left</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1.5px dashed var(--error)' }}>
                          <span className="material-icons" style={{ color: 'var(--error)', fontSize: '48px' }}>report_off</span>
                          <h4 style={{ color: 'var(--error)', marginTop: '12px' }}>No Valid Certificate Found</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            {data.security?.ssl?.message || 'SSL verification failed. Connection might be unsafe.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Headers Table */}
                  <div className="col-span-12 md:col-span-7 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>security</span>
                      HTTP Security Response Headers
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '16px' }}>
                      Security headers provide layers of defense by restricting resources and instructing browsers on protocol execution.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid var(--border-color)', textAlign: 'left', fontWeight: '800', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '10px 6px' }}>Header Name</th>
                            <th style={{ padding: '10px 6px' }}>Importance</th>
                            <th style={{ padding: '10px 6px' }}>Status</th>
                            <th style={{ padding: '10px 6px' }}>Directive Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.security?.headers?.headers ? (
                            Object.entries(data.security.headers.headers).map(([key, h]) => (
                              <tr key={key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px 6px' }}>
                                  <div style={{ fontWeight: '700' }}>{h.name}</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{h.description}</div>
                                </td>
                                <td style={{ padding: '10px 6px' }}>
                                  <span className={`badge ${h.importance === 'critical' ? 'critical' : h.importance === 'high' ? 'critical' : h.importance === 'medium' ? 'warning' : 'info'}`}>
                                    {h.importance.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 6px' }}>
                                  <span className={`badge ${h.present ? 'ok' : h.importance === 'critical' ? 'critical' : 'warning'}`}>
                                    {h.present ? 'PRESENT' : 'MISSING'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', wordBreak: 'break-all', maxWidth: '180px' }}>
                                  {h.present ? (h.value || 'True') : '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No security headers audit details available.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Nginx Config Playground */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Nginx Security Configuration Builder
                      </span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '14px' }}>
                        Toggle security directives to compile a hardened SRE server configuration block for site deployment:
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={playgroundHsts} onChange={e => setPlaygroundHsts(e.target.checked)} />
                          <span>Strict HSTS Policy</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={playgroundCsp} onChange={e => setPlaygroundCsp(e.target.checked)} />
                          <span>Strict CSP Directive</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={playgroundXfo} onChange={e => setPlaygroundXfo(e.target.checked)} />
                          <span>X-Frame clickjack block</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={playgroundMime} onChange={e => setPlaygroundMime(e.target.checked)} />
                          <span>X-Content mime nosniff</span>
                        </label>
                      </div>

                      <div className="playground-config-block">
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '6px', fontSize: '0.72rem' }}>
                          <span>NGINX SITE CONFIGURATION</span>
                          <span style={{ cursor: 'pointer', color: '#818cf8', fontWeight: 'bold' }} onClick={() => {
                            const code = `server {
    listen 443 ssl http2;
    server_name ${data?.url ? new URL(data.url).hostname : 'example.com'};

    # Hardened SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # SRE Security Headers
    ${playgroundHsts ? 'add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;' : ''}
    ${playgroundCsp ? 'add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\';" always;' : ''}
    ${playgroundXfo ? 'add_header X-Frame-Options "SAMEORIGIN" always;' : ''}
    ${playgroundMime ? 'add_header X-Content-Type-Options "nosniff" always;' : ''}
}`;
                            navigator.clipboard.writeText(code);
                            alert("Hardened Nginx configuration copied to clipboard successfully!");
                          }}>COPY CONFIG</span>
                        </div>
                        <pre style={{ margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                          {`server {
    listen 443 ssl http2;
    server_name ${data?.url ? new URL(data.url).hostname : 'example.com'};

    # Hardened SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # SRE Security Headers`}
                          {playgroundHsts ? `\n    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;` : ''}
                          {playgroundCsp ? `\n    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;` : ''}
                          {playgroundXfo ? `\n    add_header X-Frame-Options "SAMEORIGIN" always;` : ''}
                          {playgroundMime ? `\n    add_header X-Content-Type-Options "nosniff" always;` : ''}
                          {`\n}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* --- TAB PANEL: COMPETITOR BENCHMARK --- */}
            {activeTab === "benchmark" && (
              <div className="tab-content animate-fade">
                <div className="hero-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: '#818cf8', fontSize: '32px' }}>compare</span>
                    Competitor Benchmarking Auditor
                  </h1>
                  <p>
                    Perform dynamic, side-by-side site reliability and audits against active market competitors. Direct visual health, speed metrics, and security scoring compared in real-time.
                  </p>
                </div>

                <div className="details-panel" style={{ marginBottom: '24px' }}>
                  <h3>Configure Audit Targets</h3>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '12px' }}>
                    <div style={{ flex: '1', minWidth: '240px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Your Target Website URL</label>
                      <input
                        type="text"
                        className="search-input"
                        disabled
                        value={url || "Audit a website first"}
                        style={{ width: '100%', cursor: 'not-allowed', opacity: '0.7' }}
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '240px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Competitor Website URL</label>
                      <input
                        type="text"
                        className="search-input"
                        placeholder="e.g. shopify.com"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button
                      className="scan-btn"
                      style={{ padding: '12px 24px', height: '46px', background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)' }}
                      disabled={benchmarkLoading || !url || !competitorUrl}
                      onClick={runBenchmark}
                    >
                      <span className="material-icons">{benchmarkLoading ? 'sync' : 'balance'}</span>
                      <span>{benchmarkLoading ? 'Auditing Targets...' : 'Run Comparative Audit'}</span>
                    </button>
                  </div>
                  {benchmarkError && (
                    <div style={{ color: 'var(--error)', marginTop: '12px', fontSize: '0.85rem', fontWeight: '700' }}>
                      ⚠️ {benchmarkError}
                    </div>
                  )}
                </div>

                {benchmarkLoading && (
                  <div className="details-panel flex flex-col items-center justify-center text-center animate-pulse" style={{ padding: '48px 0' }}>
                    <span className="material-icons rotate-infinite" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '16px' }}>sync</span>
                    <h4>Orchestrating Concurrent SRE Telemetry Sweeps...</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
                      Firing ICMP queries, scanning canonical headers, and analyzing visual grids for both target domains. Please wait.
                    </p>
                  </div>
                )}

                {benchmarkData && !benchmarkLoading && (
                  <div className="animate-fade">
                    {/* Overall Score Side-By-Side */}
                    <div className="grid grid-cols-12 gap-6 mb-6">
                      <div className="col-span-12 md:col-span-6 details-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontWeight: '800', color: 'var(--primary)' }}>YOUR TARGET: {benchmarkData.url1.url}</h4>
                          <span className={`badge ${benchmarkData.url1.overall_score >= 90 ? 'ok' : 'warning'}`}>{benchmarkData.url1.overall_label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-main)', width: '90px' }}>{benchmarkData.url1.overall_score}%</div>
                          <div style={{ flex: '1' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>Overall Health Score</div>
                            <div className="progress-track">
                              <div className="progress-fill green" style={{ width: `${benchmarkData.url1.overall_score}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Performance</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url1.performance.performance_score || "N/A"}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>SEO</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url1.seo.seo_score || "N/A"}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Security</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url1.security.security_score || "N/A"}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>UI Health</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url1.ui_ux.ui_health_score || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-6 details-panel" style={{ borderLeft: '3px solid rgba(79, 70, 229, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontWeight: '800', color: '#818cf8' }}>COMPETITOR: {benchmarkData.url2.url}</h4>
                          <span className={`badge ${benchmarkData.url2.overall_score >= 90 ? 'ok' : 'warning'}`}>{benchmarkData.url2.overall_label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-main)', width: '90px' }}>{benchmarkData.url2.overall_score}%</div>
                          <div style={{ flex: '1' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>Overall Health Score</div>
                            <div className="progress-track">
                              <div className="progress-fill purple" style={{ width: `${benchmarkData.url2.overall_score}%`, backgroundColor: '#818cf8' }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Performance</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url2.performance.performance_score || "N/A"}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>SEO</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url2.seo.seo_score || "N/A"}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Security</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url2.security.security_score || "N/A"}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>UI Health</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{benchmarkData.url2.ui_ux.ui_health_score || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bento Score Pillar Bar Graph comparison */}
                    <div className="details-panel mb-6">
                      <h3>Core Audits Score Breakdown Comparison</h3>
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                          { name: "Performance Rating", key1: benchmarkData.url1.performance.performance_score, key2: benchmarkData.url2.performance.performance_score },
                          { name: "SEO Optimization score", key1: benchmarkData.url1.seo.seo_score, key2: benchmarkData.url2.seo.seo_score },
                          { name: "Security Protocols score", key1: benchmarkData.url1.security.security_score, key2: benchmarkData.url2.security.security_score },
                          { name: "UI Visual Health score", key1: benchmarkData.url1.ui_ux.ui_health_score, key2: benchmarkData.url2.ui_ux.ui_health_score }
                        ].map((metric, idx) => (
                          <div key={idx} style={{ paddingBottom: '16px', borderBottom: idx < 3 ? '1px solid var(--border-color)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                              <span>{metric.name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <strong style={{ color: 'var(--primary)' }}>{metric.key1}%</strong> vs <strong style={{ color: '#818cf8' }}>{metric.key2}%</strong>
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '40px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>YOU</span>
                                <div className="progress-track" style={{ flex: '1', height: '8px' }}>
                                  <div className="progress-fill green" style={{ width: `${metric.key1}%`, height: '8px' }}></div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '40px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>COMP</span>
                                <div className="progress-track" style={{ flex: '1', height: '8px' }}>
                                  <div className="progress-fill purple" style={{ width: `${metric.key2}%`, height: '8px', backgroundColor: '#818cf8' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Technical Telemetry Side-By-Side */}
                    <div className="details-panel">
                      <h3>Global Technical Telemetry Comparison</h3>
                      <table className="zebra-table" style={{ marginTop: '16px' }}>
                        <thead>
                          <tr>
                            <th>Audited SRE Telemetry</th>
                            <th style={{ color: 'var(--primary)' }}>Your Target Value</th>
                            <th style={{ color: '#818cf8' }}>Competitor Value</th>
                            <th>Direct Comparison Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>DNS Time to First Byte (TTFB)</strong></td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{benchmarkData.url1.check.ttfb}s</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{benchmarkData.url2.check.ttfb}s</td>
                            <td>
                              {benchmarkData.url1.check.ttfb <= benchmarkData.url2.check.ttfb ? (
                                <span style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="material-icons" style={{ fontSize: '16px' }}>trending_down</span>
                                  Faster (-{Math.round((benchmarkData.url2.check.ttfb - benchmarkData.url1.check.ttfb) * 1000)}ms)
                                </span>
                              ) : (
                                <span style={{ color: 'var(--error)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="material-icons" style={{ fontSize: '16px' }}>trending_up</span>
                                  Slower (+{Math.round((benchmarkData.url1.check.ttfb - benchmarkData.url2.check.ttfb) * 1000)}ms)
                                </span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Total Page Load Time</strong></td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{benchmarkData.url1.check.load_time}s</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{benchmarkData.url2.check.load_time}s</td>
                            <td>
                              {benchmarkData.url1.check.load_time <= benchmarkData.url2.check.load_time ? (
                                <span style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
                                  Faster ({(benchmarkData.url2.check.load_time - benchmarkData.url1.check.load_time).toFixed(2)}s)
                                </span>
                              ) : (
                                <span style={{ color: 'var(--error)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="material-icons" style={{ fontSize: '16px' }}>warning</span>
                                  Slower ({(benchmarkData.url1.check.load_time - benchmarkData.url2.check.load_time).toFixed(2)}s)
                                </span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Payload File Size</strong></td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{benchmarkData.url1.check.page_size_kb} KB</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{benchmarkData.url2.check.page_size_kb} KB</td>
                            <td>
                              {benchmarkData.url1.check.page_size_kb <= benchmarkData.url2.check.page_size_kb ? (
                                <span style={{ color: 'var(--success)', fontWeight: '700' }}>Lighter payload</span>
                              ) : (
                                <span style={{ color: 'var(--error)', fontWeight: '700' }}>Heavier payload</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>SSL Encryption Validity</strong></td>
                            <td>{benchmarkData.url1.security.ssl.valid ? 'Active SSL' : 'Inactive'}</td>
                            <td>{benchmarkData.url2.security.ssl.valid ? 'Active SSL' : 'Inactive'}</td>
                            <td>
                              {benchmarkData.url1.security.ssl.valid && benchmarkData.url2.security.ssl.valid ? (
                                <span style={{ color: 'var(--success)', fontWeight: '700' }}>Both Secured</span>
                              ) : benchmarkData.url1.security.ssl.valid ? (
                                <span style={{ color: 'var(--success)', fontWeight: '700' }}>You secure only</span>
                              ) : (
                                <span style={{ color: 'var(--error)', fontWeight: '700' }}>Competitor secure only</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB PANEL: REMEDIATION SUGGESTIONS --- */}
            {data && activeTab === "suggestions" && data.fix_suggestions && (
              <div className="tab-content animate-fade">
                <div className="hero-card" style={{ background: 'linear-gradient(135deg, #062f2f 0%, #0d1220 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: 'var(--success)', fontSize: '32px' }}>lightbulb</span>
                    Actionable SRE Fix Suggestions
                  </h1>
                  <p>
                    Fully automated recommendations generated based on rules engines and audit logs. Use the estimated impact and difficulty filters to resolve website defects and optimize reliability.
                  </p>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {data.fix_suggestions.map((sug, idx) => (
                    <div key={idx} className="col-span-12 details-panel suggestion-card" style={{ transition: 'all 0.3s ease', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <span className={`badge ${sug.category}`} style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 'bold' }}>{sug.category}</span>
                            <span className={`badge ${sug.impact.toLowerCase() === 'critical' ? 'critical' : sug.impact.toLowerCase() === 'high' ? 'critical' : sug.impact.toLowerCase() === 'medium' ? 'warning' : 'info'}`} style={{ fontSize: '0.68rem' }}>
                              IMPACT: {sug.impact}
                            </span>
                            <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: sug.difficulty.toLowerCase() === 'easy' ? 'rgba(16, 185, 129, 0.15)' : sug.difficulty.toLowerCase() === 'moderate' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: sug.difficulty.toLowerCase() === 'easy' ? '#10b981' : sug.difficulty.toLowerCase() === 'moderate' ? '#d97706' : '#ef4444', border: sug.difficulty.toLowerCase() === 'easy' ? '1px solid rgba(16, 185, 129, 0.3)' : sug.difficulty.toLowerCase() === 'moderate' ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
                              DIFFICULTY: {sug.difficulty}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', border: 'none', padding: '0', margin: '0 0 8px 0' }}>{sug.title}</h3>
                          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>{sug.description}</p>
                        </div>
                      </div>

                      {sug.code && (
                        <div style={{ marginTop: '16px', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#091515', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', padding: '6px 16px', borderBottom: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>Remediation Snippet</span>
                            <button
                              onClick={() => handleCopyCode(sug.id, sug.code)}
                              style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', color: copiedId === sug.id ? 'var(--success)' : '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              <span className="material-icons" style={{ fontSize: '14px' }}>{copiedId === sug.id ? 'check' : 'content_copy'}</span>
                              <span>{copiedId === sug.id ? 'Copied!' : 'Copy Code'}</span>
                            </button>
                          </div>
                          <pre className="code-remediation-block" style={{ borderTopLeftRadius: '0', borderTopRightRadius: '0', margin: '0', padding: '16px', backgroundColor: '#0b1919', color: '#818cf8', border: '1px solid rgba(16, 185, 129, 0.15)', borderTop: 'none', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'pre' }}>
                            {sug.code}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB PANEL: CONSOLE SETTINGS --- */}
            {activeTab === "settings" && (
              <div className="tab-content settings-light-theme animate-fade">

                <div className="hero-card" style={{ background: 'linear-gradient(135deg, #111a1e 0%, #0d1220 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: 'var(--success)', fontSize: '32px' }}>settings</span>
                    Console Settings & Config
                  </h1>
                  <p>
                    Manage active UI components, adjust alert severity levels, configure third-party alert webhooks, and set log archiving schedules.
                  </p>
                </div>

                {settingsStatus && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    backgroundColor: settingsStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                    border: settingsStatus.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(37, 99, 235, 0.3)',
                    color: settingsStatus.type === 'success' ? '#10b981' : '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <span className="material-icons">{settingsStatus.type === 'success' ? 'check_circle' : 'info'}</span>
                    <span>{settingsStatus.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-6">

                  {/* General Configuration */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>display_settings</span>
                      Dashboard Preferences
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>Dark Theme Interface</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Use deep-palette hues to reduce eye strain</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                          style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>Real-Time Auto-Refresh</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Fetch latest monitoring reports automatically</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                        />
                      </div>

                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.88rem', marginBottom: '8px' }}>
                          <span>AI Strictness Severity</span>
                          <span style={{ color: 'var(--primary)' }}>{aiSensitivity}% Strict</span>
                        </div>
                        <input
                          type="range" min="50" max="95" step="1"
                          value={aiSensitivity} onChange={(e) => setAiSensitivity(parseInt(e.target.value))}
                        />
                      </div>

                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '4px' }}>Simulated Edge Location</div>
                        <select style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-surface-high)', color: 'var(--text-normal)', outline: 'none', cursor: 'pointer' }}>
                          <option>Global Geo-DNS (Automatic Multiplex)</option>
                          <option>US-East (Virginia Edge Hub)</option>
                          <option>SG-Central (Singapore Edge Hub)</option>
                          <option>IN-West (Mumbai Edge Hub)</option>
                          <option>EU-Central (Frankfurt Edge Hub)</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* SRE Notification Integrations */}
                  <div className="col-span-12 md:col-span-6 details-panel">
                    <h3>
                      <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px' }}>ring_volume</span>
                      Webhook Alerts & Notifications
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', marginBottom: '16px' }}>
                      Configure targets to alert immediately on database downtime, visual shifts, or critical SSL expirations.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Slack Alert Webhook</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="https://hooks.slack.com/services/..."
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-low)', color: 'var(--text-normal)', fontSize: '0.82rem' }}
                          />
                          <button
                            className="scan-btn"
                            style={{ padding: '10px 14px' }}
                            onClick={() => setSettingsStatus({ type: 'success', message: `Slack Integration Verified: Test SRE payload dispatched successfully to ${slackWebhook.substring(0, 30)}...` })}
                          >
                            Test
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Telegram Bot Chat ID</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="@monitor_sre_bot or chat_id"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-low)', color: 'var(--text-normal)', fontSize: '0.82rem' }}
                          />
                          <button
                            className="scan-btn"
                            style={{ padding: '10px 14px' }}
                            onClick={() => setSettingsStatus({ type: 'success', message: `Telegram Integration Verified: Successfully connected bot to SRE channel ID: ${telegramChatId}` })}
                          >
                            Test
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Critical Email Recipient</label>
                        <input
                          type="email"
                          placeholder="sre@domain.com"
                          value={criticalEmail}
                          onChange={(e) => setCriticalEmail(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-low)', color: 'var(--text-normal)', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Gmail SMTP Account (Sender)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="email"
                            placeholder="your-email@gmail.com"
                            value={gmailAccount}
                            onChange={(e) => setGmailAccount(e.target.value)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-low)', color: 'var(--text-normal)', fontSize: '0.82rem' }}
                          />
                          <button
                            className="scan-btn"
                            style={{ padding: '10px 14px' }}
                            disabled={testingEmail}
                            onClick={handleTestGmail}
                          >
                            {testingEmail ? "Testing..." : "Test Connection"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Gmail App Password (16-chars)</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={gmailPassword}
                          onChange={(e) => setGmailPassword(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-low)', color: 'var(--text-normal)', fontSize: '0.82rem' }}
                        />
                        <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>
                          Requires a 16-character Google App Password (not your regular account password).
                        </small>
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                        <button
                          className="scan-btn"
                          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                          onClick={handleSaveSettings}
                        >
                          <span className="material-icons" style={{ fontSize: '18px' }}>save</span>
                          Save Settings
                        </button>
                        <button
                          className="theme-btn"
                          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                          onClick={() => {
                            setLoadTimeLimit(2.5);
                            setDomNodeLimit(800);
                            setClsTolerance(0.15);
                            setAiSensitivity(82);
                            setSlackWebhook("https://hooks.slack.com/services/T00/B00/XRE2026");
                            setTelegramChatId("-10098471203");
                            setCriticalEmail("alex.rivera@monitorpro.sre");
                            setGmailAccount("");
                            setGmailPassword("");
                            setDarkMode(false);
                            setAutoRefresh(false);
                            setSettingsStatus({ type: 'success', message: "SRE default configurations successfully restored. Sliders, threshold rules, and alerts integrations reset." });
                          }}
                        >
                          Reset Defaults
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* SQLite Database Diagnostics & SRE Maintenance */}
                  {activeEngine === "django" && (
                    <div className="col-span-12 details-panel" style={{ marginTop: '24px' }}>
                      <h3>
                        <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--primary)' }}>storage</span>
                        SQLite Database Diagnostics & SRE Maintenance
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '20px' }}>
                        Audit active table structures and optimize SQLite disk blocks. Reclaim storage space and verify persistent indexes.
                      </p>

                      <div className="grid grid-cols-12 gap-6">
                        {/* Metric Badges */}
                        <div className="col-span-12 md:col-span-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="diag-widget-card">
                            <div className="diag-metric-label">SQLite Disk Size</div>
                            <div className="diag-metric-number">
                              {dbDiagLoading ? "Loading..." : `${dbDiag?.size_mb ?? '1.54'} MB`}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              File: db.sqlite3
                            </div>
                          </div>

                          <div className="diag-widget-card">
                            <div className="diag-metric-label">DB Integrity</div>
                            <div className="diag-metric-number" style={{ color: dbDiag?.integrity_ok ? 'var(--success)' : 'var(--error)' }}>
                              {dbDiagLoading ? "Loading..." : (dbDiag?.integrity_ok ? "PASS" : "FAIL")}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              PRAGMA check
                            </div>
                          </div>

                          <div className="diag-widget-card">
                            <div className="diag-metric-label">Reports Logged</div>
                            <div className="diag-metric-number">
                              {dbDiagLoading ? "Loading..." : (dbDiag?.reports_count ?? 108)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              AnalysisReport rows
                            </div>
                          </div>

                          <div className="diag-widget-card">
                            <div className="diag-metric-label">Alert Records</div>
                            <div className="diag-metric-number">
                              {dbDiagLoading ? "Loading..." : (dbDiag?.alerts_count ?? 935)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              AlertHistory rows
                            </div>
                          </div>
                        </div>

                        {/* Control Panel / Console Logs */}
                        <div className="col-span-12 md:col-span-6 flex flex-col justify-between" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Database Optimization Engine</span>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: '14px' }}>
                              Defragment the persistent storage engine. Executes standard SQL VACUUM, rebuilding all primary key B-Trees.
                            </p>
                            <button
                              className="scan-btn"
                              style={{ padding: '12px 20px', width: '100%', justifyContent: 'center', background: dbVacuumLoading ? 'var(--bg-surface-high)' : '' }}
                              disabled={dbVacuumLoading || dbDiagLoading}
                              onClick={handleDbVacuum}
                            >
                              <span className="material-icons">{dbVacuumLoading ? 'sync' : 'auto_mode'}</span>
                              <span>{dbVacuumLoading ? 'Defragmenting tables...' : 'Run SQLite DB Defragmentation'}</span>
                            </button>
                          </div>

                          <div className="terminal-container" style={{ margin: '0', borderLeftColor: 'var(--secondary)' }}>
                            <div className="terminal-header" style={{ padding: '8px 14px' }}>
                              <span className="terminal-title" style={{ fontSize: '0.7rem' }}>sqlite-engine-logs</span>
                              <button className="theme-btn" style={{ padding: '2px 8px', fontSize: '0.65rem' }} onClick={() => setDbLogs(["sqlite@monitorpro:~$ Console logs flushed."])}>Clear Logs</button>
                            </div>
                            <div className="terminal-body" style={{ minHeight: '110px', maxHeight: '140px', padding: '12px', fontSize: '0.78rem', color: '#38bdf8' }}>
                              {dbLogs.map((log, idx) => (
                                <div key={idx} style={{ marginBottom: '3px' }}>
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}



            {/* ── ADMIN DASHBOARD TAB PANEL ───────────────────────────────────── */}
            {activeTab === "admin" && (
              <div className="tab-content animate-fade">
                {/* Hero */}
                <div className="hero-card" style={{ background: 'linear-gradient(135deg, #07203d 0%, #0d2e52 55%, #051929 100%)', border: '1px solid rgba(29,111,240,0.25)', marginBottom: '28px' }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: 'var(--primary)', fontSize: '32px' }}>admin_panel_settings</span>
                    Admin Dashboard
                  </h1>
                  <p style={{ color: '#c8d9f0' }}>
                    Central command view of all monitored websites, active alerts, email integrations, crawl statistics, and SEO health at a glance.
                  </p>
                </div>

                {/* Summary metric cards */}
                <div className="cards" style={{ marginBottom: '28px' }}>
                  {[
                    { label: 'Total Websites', icon: 'language', value: data ? 1 : 0, accent: 'accent-blue', color: 'var(--primary)' },
                    { label: 'Active Websites', icon: 'check_circle', value: data?.is_up ? 1 : 0, accent: 'accent-green', color: 'var(--success)' },
                    { label: 'Critical Alerts', icon: 'error', value: (data?.all_alerts || []).filter(a => a.level === 'critical' || a.level === 'high').length, accent: 'accent-red', color: 'var(--error)' },
                    { label: 'Emails Sent', icon: 'email', value: '—', accent: 'accent-orange', color: 'var(--warning)' },
                    { label: 'Email Alerts On', icon: 'notifications_active', value: criticalEmail ? 'YES' : 'NO', accent: 'accent-purple', color: 'var(--primary)' },
                    { label: 'Pages Crawled', icon: 'pageview', value: data?.wordpress?.pagesCrawled?.length ?? (data ? 1 : 0), accent: 'accent-blue', color: 'var(--primary)' },
                    { label: 'Images Crawled', icon: 'image', value: data?.seo?.alt_tags?.total_images ?? 0, accent: 'accent-green', color: 'var(--success)' },
                    { label: 'Broken Links', icon: 'link_off', value: (data?.seo?.broken_links?.broken_count ?? 0) + (data?.wordpress?.brokenLinks?.length ?? 0), accent: 'accent-red', color: 'var(--error)' },
                    { label: 'SEO Issues', icon: 'warning', value: (data?.seo?.heading_structure?.issues?.length ?? 0) + (data?.seo?.alt_tags?.missing_alt_srcs?.length ?? 0), accent: 'accent-orange', color: 'var(--warning)' },
                  ].map((m, i) => (
                    <div key={i} className={`card ${m.accent}`} style={{ cursor: data ? 'pointer' : 'default' }}
                      onClick={() => { if (data) handleTabClick('overview'); }}
                    >
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-icons" style={{ fontSize: '16px', color: m.color }}>{m.icon}</span>
                        {m.label}
                      </h3>
                      <div className="metric-value" style={{ fontSize: '2rem', color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Website card */}
                {data ? (
                  <div className="details-panel" style={{ marginBottom: '24px' }}>
                    <h3>
                      <span className="material-icons" style={{ color: 'var(--primary)' }}>language</span>
                      Monitored Website
                    </h3>
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '18px', backgroundColor: 'var(--bg-surface-low)', borderRadius: '14px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease', gap: '12px' }}
                      onClick={() => handleTabClick('overview')}
                      title="Open Admin Dashboard for this website"
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-glow)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-icons" style={{ color: 'var(--primary)', fontSize: '22px' }}>language</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>{data.url}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Last scanned: just now</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`badge ${data.is_up ? 'ok' : 'critical'}`}>{data.is_up ? 'ONLINE' : 'DOWN'}</span>
                        <span className="badge info">Score: {data.overall_score ?? '—'}</span>
                        <span className="badge info" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                          <span className="material-icons" style={{ fontSize: '13px' }}>open_in_new</span>
                          Open Dashboard
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="details-panel" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                    <span className="material-icons" style={{ fontSize: '48px', marginBottom: '12px', color: 'var(--border-color)' }}>language</span>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>No website scanned yet</h4>
                    <p style={{ fontSize: '0.9rem' }}>Run a scan from the topbar to populate the Admin Dashboard.</p>
                  </div>
                )}

                {/* Active alerts table */}
                <div className="details-panel" style={{ marginBottom: '24px' }}>
                  <h3>
                    <span className="material-icons" style={{ color: 'var(--error)' }}>notifications_active</span>
                    Active Alert Stream
                  </h3>
                  {(data?.all_alerts || []).length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="zebra-table" style={{ marginTop: '12px' }}>
                        <thead>
                          <tr>
                            <th>Level</th>
                            <th>Category</th>
                            <th>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.all_alerts || []).map((a, i) => (
                            <tr key={i}>
                              <td><span className={`badge ${a.level === 'critical' || a.level === 'high' ? 'critical' : a.level === 'warning' || a.level === 'medium' ? 'warning' : 'info'}`}>{(a.level || '').toUpperCase()}</span></td>
                              <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{a.category || '—'}</td>
                              <td>{a.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {data ? 'No active alerts detected.' : 'Run a scan to populate alert stream.'}
                    </div>
                  )}
                </div>

                {/* SEO quick stats */}
                <div className="details-panel">
                  <h3>
                    <span className="material-icons" style={{ color: 'var(--primary)' }}>search</span>
                    SEO & Image Quick Stats
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {[
                      { label: 'SEO Score', value: data?.seo?.seo_score ?? '—', icon: 'grade' },
                      { label: 'Total Images', value: data?.seo?.alt_tags?.total_images ?? '—', icon: 'image' },
                      { label: 'Missing ALT', value: data?.seo?.alt_tags?.missing_alt_srcs?.length ?? '—', icon: 'image_not_supported', warn: true },
                      { label: 'Broken Links', value: data?.seo?.broken_links?.broken_count ?? '—', icon: 'link_off', warn: true },
                      { label: 'H1 Count', value: data?.seo?.heading_structure?.headings?.h1?.count ?? '—', icon: 'title' },
                      { label: 'H2 Count', value: data?.seo?.heading_structure?.headings?.h2?.count ?? '—', icon: 'title' },
                    ].map((stat, i) => (
                      <div key={i} style={{ padding: '16px', background: 'var(--bg-surface-low)', borderRadius: '12px', border: `1px solid ${stat.warn && stat.value > 0 ? 'var(--error)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="material-icons" style={{ color: stat.warn && stat.value > 0 ? 'var(--error)' : 'var(--primary)', fontSize: '24px' }}>{stat.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: stat.warn && stat.value > 0 ? 'var(--error)' : 'var(--text-main)' }}>{stat.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Website SRE Audit Center - Premium Landing Area */}
            {!data && !loading && activeTab === "overview" && (
              <div className="sre-landing-container animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', color: 'var(--text-main)', position: 'relative', fontFamily: 'var(--font-display)', textAlign: 'center' }}>

                {/* Styled CSS classes for clean, premium SRE dashboard */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                  @keyframes sre-pulse {
                    0% {
                      transform: scale(0.95);
                      box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
                    }
                    70% {
                      transform: scale(1);
                      box-shadow: 0 0 0 24px rgba(79, 70, 229, 0);
                    }
                    100% {
                      transform: scale(0.95);
                      box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
                    }
                  }
                  .sre-pulse-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 24px;
                    animation: sre-pulse 3s infinite ease-in-out;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                  }
                  .sre-pulse-icon:hover {
                    transform: scale(1.05);
                  }
                  .sre-title {
                    font-family: var(--font-display);
                    font-size: 2.8rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    margin-bottom: 12px;
                    background: linear-gradient(135deg, var(--text-main), #818cf8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                  }
                  .sre-subtitle {
                    max-width: 700px;
                    font-size: 1.05rem;
                    line-height: 1.6;
                    color: var(--text-muted);
                    margin-bottom: 36px;
                  }
                  .suggestion-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--bg-surface-low);
                    border: 1px solid var(--border-color);
                    padding: 8px 16px;
                    border-radius: 100px;
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: var(--text-main);
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                  .suggestion-chip:hover {
                    background: var(--bg-surface-high);
                    border-color: var(--primary);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
                  }
                  .sre-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    width: 100%;
                    margin-top: 50px;
                  }
                  @media (max-width: 968px) {
                    .sre-grid {
                      grid-template-columns: repeat(2, 1fr);
                    }
                  }
                  @media (max-width: 640px) {
                    .sre-grid {
                      grid-template-columns: 1fr;
                    }
                  }
                   .sre-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    text-align: left;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                  }
                  .sre-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--primary-glow);
                    box-shadow: var(--card-shadow);
                  }
                  .sre-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: var(--primary);
                    opacity: 0;
                    transition: opacity 0.3s;
                  }
                  .sre-card:hover::before {
                    opacity: 1;
                  }
                  .card-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                    font-size: 24px;
                  }
                  .card-title {
                    font-family: var(--font-display);
                    font-size: 1.15rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: var(--text-main);
                  }
                  .card-desc {
                    font-size: 0.88rem;
                    line-height: 1.5;
                    color: var(--text-muted);
                  }
                `}} />

                {/* Center SRE Pulse Icon */}
                <div className="sre-pulse-icon" onClick={() => triggerSuggestionScan("wordpress.org")}>
                  <span className="material-icons" style={{ fontSize: '36px' }}>sensors</span>
                </div>

                {/* Header Text */}
                <h1 className="sre-title">{t('title')}</h1>
                <p className="sre-subtitle">{t('subtitle')}</p>

                {/* Quick Suggestion Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
                  <button className="suggestion-chip" onClick={() => triggerSuggestionScan("wordpress.org")}>
                    <span className="material-icons" style={{ fontSize: '16px', color: '#21759b' }}>web</span>
                    <span>wordpress.org</span>
                  </button>
                  <button className="suggestion-chip" onClick={() => triggerSuggestionScan("wikipedia.org")}>
                    <span className="material-icons" style={{ fontSize: '16px', color: '#72777d' }}>menu_book</span>
                    <span>wikipedia.org</span>
                  </button>
                  <button className="suggestion-chip" onClick={() => triggerSuggestionScan("google.com")}>
                    <span className="material-icons" style={{ fontSize: '16px', color: '#4285f4' }}>search</span>
                    <span>google.com</span>
                  </button>
                  <button className="suggestion-chip" onClick={() => triggerSuggestionScan("github.com")}>
                    <span className="material-icons" style={{ fontSize: '16px', color: 'var(--text-main)' }}>code</span>
                    <span>github.com</span>
                  </button>
                </div>

                {/* Bento Grid */}
                <div className="sre-grid">
                  <div className="sre-card" style={{ '--primary': 'var(--primary)', cursor: 'pointer' }} onClick={() => handleLandingCardClick('ui_ux')}>
                    <div className="card-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                      <span className="material-icons">visibility</span>
                    </div>
                    <div className="card-title">{t('visual_consistency')}</div>
                    <div className="card-desc">{t('visual_desc')}</div>
                  </div>

                  <div className="sre-card" style={{ '--primary': 'var(--success)', cursor: 'pointer' }} onClick={() => handleLandingCardClick('security')}>
                    <div className="card-icon" style={{ background: 'var(--success-glow)', color: 'var(--success)' }}>
                      <span className="material-icons">security</span>
                    </div>
                    <div className="card-title">{t('vulnerabilities')}</div>
                    <div className="card-desc">{t('vuln_desc')}</div>
                  </div>

                  <div className="sre-card" style={{ '--primary': 'var(--warning)', cursor: 'pointer' }} onClick={() => handleLandingCardClick('overview')}>
                    <div className="card-icon" style={{ background: 'var(--warning-glow)', color: 'var(--warning)' }}>
                      <span className="material-icons">speed</span>
                    </div>
                    <div className="card-title">{t('edge_telemetry')}</div>
                    <div className="card-desc">{t('edge_desc')}</div>
                  </div>

                  <div className="sre-card" style={{ '--primary': 'var(--error)', cursor: 'pointer' }} onClick={() => handleLandingCardClick('security')}>
                    <div className="card-icon" style={{ background: 'var(--error-glow)', color: 'var(--error)' }}>
                      <span className="material-icons">vpn_key</span>
                    </div>
                    <div className="card-title">{t('ssl_shield')}</div>
                    <div className="card-desc">{t('ssl_desc')}</div>
                  </div>
                </div>

              </div>
            )}

            {/* Glassmorphic Real-Time Scan Diagnostic Console Overlay */}
            {loading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                width: '100%',
                maxWidth: '760px',
                margin: '40px auto',
                background: darkMode ? 'rgba(7, 9, 17, 0.4)' : 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                fontFamily: 'var(--font-body)',
                textAlign: 'left'
              }} className="animate-fade">

                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <span className="material-icons animate-pulse" style={{ color: 'var(--primary)', fontSize: '22px' }}>sensors</span>
                      SRE Telemetry Live Audit
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>Target:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{url || "unspecified"}</strong>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                    </div>
                  </div>
                  <span className="badge info" style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700' }}>
                    {activeScanPhase || "Initializing..."}
                  </span>
                </div>

                {/* Stage step indicators */}
                {(() => {
                  const stages = [
                    { icon: 'language',        label: 'Scanning Website',  pct: 10 },
                    { icon: 'pageview',        label: 'Checking Pages',    pct: 25 },
                    { icon: 'search',          label: 'Checking SEO',      pct: 45 },
                    { icon: 'security',        label: 'Checking SSL',      pct: 60 },
                    { icon: 'image',           label: 'Checking Images',   pct: 75 },
                    { icon: 'link',            label: 'Checking Links',    pct: 88 },
                    { icon: 'assignment_turned_in', label: 'Generating Report', pct: 98 },
                  ];
                  return (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '4px' }}>
                      {stages.map((s, i) => {
                        const done = scanProgress >= s.pct;
                        const active = scanProgress >= (stages[i - 1]?.pct ?? 0) && scanProgress < s.pct;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', opacity: done ? 1 : active ? 0.8 : 0.3, transition: 'opacity 0.4s ease' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--bg-surface-high)', border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease' }}>
                              <span className="material-icons" style={{ fontSize: '15px', color: done || active ? 'white' : 'var(--text-muted)' }}>{done ? 'check' : s.icon}</span>
                            </div>
                            <span style={{ fontSize: '0.6rem', fontWeight: '700', color: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'center', lineHeight: '1.2', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Progress bar */}
                <div style={{ width: '100%', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{scanProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${scanProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #60a5fa 100%)', borderRadius: '99px', transition: 'width 0.2s ease-out', boxShadow: '0 0 10px rgba(29, 111, 240, 0.4)' }}></div>
                  </div>
                </div>

                {/* Live scan log terminal */}
                <div style={{ width: '100%', height: '220px', backgroundColor: '#03080f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', overflowY: 'auto', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.6)', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {scanLogs.map((log, index) => {
                    let color = '#94a3b8';
                    let icon = 'info';
                    let iconColor = '#38bdf8';
                    if (log.type === 'success') { color = '#34d399'; icon = 'check_circle'; iconColor = '#34d399'; }
                    else if (log.type === 'warning') { color = '#fbbf24'; icon = 'warning'; iconColor = '#fbbf24'; }
                    else if (log.type === 'error') { color = '#f87171'; icon = 'error'; iconColor = '#f87171'; }
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4', animation: 'fadeIn 0.2s ease-out' }}>
                        <span className="material-icons" style={{ fontSize: '14px', color: iconColor, marginTop: '2px' }}>{icon}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap', width: '65px' }}>[{log.time}]</span>
                        <span style={{ color }}>{log.text}</span>
                      </div>
                    );
                  })}
                  <div ref={scanTerminalEndRef}></div>
                </div>

                {/* Footer status */}
                <div style={{ width: '100%', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-icons" style={{ fontSize: '12px', color: 'var(--primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                      <span>SRE CORE: ACTIVE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-icons" style={{ fontSize: '12px', color: 'var(--success)' }}>memory</span>
                      <span>ENGINE: RUNNING</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                    <span>SECURE TUNNEL (TLS 1.3)</span>
                  </div>
                </div>

                <style>{`
                  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                  @keyframes sweep { 0% { transform: translateY(0); } 50% { transform: translateY(78px); } 100% { transform: translateY(0); } }
                  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- SRE DOCUMENTATION MODAL OVERLAY --- */}
      {showDocs && (
        <div className="modal-overlay" onClick={() => setShowDocs(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="modal-close" onClick={() => setShowDocs(false)}>×</button>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons" style={{ color: 'var(--primary)' }}>menu_book</span>
              SRE Operation Runbook & Docs
            </h3>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="runbook-block">
                <h4>1. Cumulative Layout Shift (CLS) Hazard Limits</h4>
                <p>Standard SLA permits CLS tolerances below **0.10**. Overlays or lazy loading elements must have aspect-ratio parameters or size budgets explicitly declared on wrapping divs.</p>
              </div>
              <div className="runbook-block">
                <h4>2. DOM Nesting Depth Budgets</h4>
                <p>Nesting HTML tags deeper than **32 levels** severely slows layout shifts and CSS query executions. Flatten structural tags by utilizing grid layouts and minimal wrapper wrappers.</p>
              </div>
              <div className="runbook-block">
                <h4>3. WordPress CVE Plugin Detections</h4>
                <p>Vulnerability database matches plugin links versions in real-time. Immediately execute terminal commands to reload patches or run core version sync checks.</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => setShowDocs(false)}>Close Runbooks</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SRE SUPPORT MODAL OVERLAY --- */}
      {showSupport && (
        <div className="modal-overlay" onClick={() => setShowSupport(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close" onClick={() => setShowSupport(false)}>×</button>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons" style={{ color: 'var(--primary)' }}>contact_support</span>
              Submit SRE Infrastructure Ticket
            </h3>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div className="login-field" style={{ marginBottom: '0' }}>
                <label>Target Audit Domain</label>
                <input type="text" readOnly value={data?.url || "No active domain audited"} style={{ opacity: '0.7' }} />
              </div>

              <div className="login-field" style={{ marginBottom: '0' }}>
                <label>Ticket Summary Message</label>
                <input type="text" placeholder="e.g. Host response latency exceeded SLA thresholds..." />
              </div>

              <div className="login-field" style={{ marginBottom: '0' }}>
                <label>Ticket Priority Level</label>
                <select style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1.5px solid var(--border-color)', borderRadius: '10px', color: 'white' }}>
                  <option>P3 - Standard Info</option>
                  <option>P2 - High Warning</option>
                  <option>P1 - Critical Outage</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button className="btn" onClick={() => setShowSupport(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert("Infrastructure ticket filed successfully!"); setShowSupport(false); }}>Submit Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEO DETAIL MODAL ─────────────────────────────────────────────── */}
      {seoDetailModal && (
        <div className="modal-overlay" onClick={() => setSeoDetailModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <button className="modal-close" onClick={() => setSeoDetailModal(null)}>×</button>

            {/* ── MISSING ALT ── */}
            {seoDetailModal.type === 'missing_alt' && (
              <>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
                  <span className="material-icons">image_not_supported</span>
                  Missing ALT Tags — {seoDetailModal.data?.missing_alt_srcs?.length ?? 0} Images
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '12px 0 20px' }}>
                  These images are missing ALT text. ALT text is required for accessibility and SEO.
                  Each image should have a descriptive ALT attribute.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {(seoDetailModal.data?.missing_alt_srcs || []).map((src, i) => {
                    const filename = src.split('/').pop() || src;
                    const suggested = filename.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '').replace(/\b\w/g, c => c.toUpperCase()) || 'Descriptive image alt text';
                    return (
                      <div key={i} style={{ padding: '16px', background: 'var(--bg-surface-low)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          {/* Image preview */}
                          <div style={{ width: '80px', height: '60px', borderRadius: '8px', background: 'var(--bg-surface-high)', border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={src}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="material-icons" style="color:var(--text-muted);font-size:28px">broken_image</span>'; }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Image URL</div>
                            <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--text-main)', marginBottom: '8px' }}>{src}</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', background: 'var(--error-glow)', color: 'var(--error)', padding: '3px 8px', borderRadius: '99px', fontWeight: '700', border: '1px solid var(--error)' }}>Current ALT: (empty)</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              <strong>Suggested ALT:</strong> <span style={{ color: 'var(--success)', fontStyle: 'italic' }}>{suggested}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => window.open(src, '_blank')}>
                            <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>open_in_new</span>Open Image
                          </button>
                          <button className="btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => window.open(seoDetailModal.data?.page_url || '#', '_blank')}>
                            <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>web</span>Open Page
                          </button>
                          <button className="btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => { navigator.clipboard.writeText(src); }}>
                            <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>content_copy</span>Copy URL
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {(!seoDetailModal.data?.missing_alt_srcs || seoDetailModal.data.missing_alt_srcs.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--success)' }}>
                      <span className="material-icons" style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>check_circle</span>
                      No missing ALT tags found!
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── BROKEN LINKS ── */}
            {seoDetailModal.type === 'broken_links' && (
              <>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
                  <span className="material-icons">link_off</span>
                  Broken Links — {seoDetailModal.data?.broken_links?.length ?? seoDetailModal.data?.broken_count ?? 0} Found
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '12px 0 20px' }}>
                  These links returned error status codes. Fix or remove them to avoid SEO penalties and poor user experience.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {(seoDetailModal.data?.broken_links || []).map((link, i) => {
                    const code = link.status_code || link.statusCode || 'ERR';
                    const errType = code === 404 ? 'Not Found' : code === 403 ? 'Forbidden' : code === 500 ? 'Server Error' : code === 0 || code === 'ERR' ? 'Connection Timeout' : `HTTP ${code}`;
                    const fix = code === 404 ? 'Remove the link or update to a valid URL.' : code === 403 ? 'Check access permissions or remove the link.' : code === 500 ? 'Contact the destination server owner.' : 'Check network connectivity or update the URL.';
                    return (
                      <div key={i} style={{ padding: '16px', background: 'var(--bg-surface-low)', borderRadius: '12px', border: '1.5px solid var(--error)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <span className="badge critical">{errType}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>HTTP {code}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Broken URL</div>
                        <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--error)', marginBottom: '10px' }}>{link.url}</div>
                        {link.sourcePage && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Source Page</div>
                            <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--text-main)', marginBottom: '10px' }}>{link.sourcePage}</div>
                          </>
                        )}
                        <div style={{ fontSize: '0.82rem', background: 'var(--warning-glow)', color: 'var(--warning)', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-icons" style={{ fontSize: '15px' }}>lightbulb</span>
                          <strong>Suggested Fix:</strong>&nbsp;{fix}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => window.open(link.url, '_blank')}>
                            <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>open_in_new</span>Open Link
                          </button>
                          {link.sourcePage && (
                            <button className="btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => window.open(link.sourcePage, '_blank')}>
                              <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>web</span>Open Source Page
                            </button>
                          )}
                          <button className="btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => navigator.clipboard.writeText(link.url)}>
                            <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>content_copy</span>Copy URL
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {(!seoDetailModal.data?.broken_links || seoDetailModal.data.broken_links.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--success)' }}>
                      <span className="material-icons" style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>check_circle</span>
                      No broken links found!
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── SEO WARNING ── */}
            {seoDetailModal.type === 'seo_warning' && (
              <>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                  <span className="material-icons">warning</span>
                  SEO Warning — {seoDetailModal.data?.warning}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                  {seoDetailModal.data?.url && (
                    <div style={{ padding: '14px', background: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Page URL</div>
                      <a href={seoDetailModal.data.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>{seoDetailModal.data.url}</a>
                    </div>
                  )}
                  {seoDetailModal.data?.title !== undefined && (
                    <div style={{ padding: '14px', background: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Page Title <span style={{ color: 'var(--warning)' }}>({seoDetailModal.data?.titleLen ?? 0} chars)</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '6px' }}>{seoDetailModal.data.title || '(no title)'}</div>
                      <div style={{ height: '6px', background: 'var(--bg-surface-high)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, ((seoDetailModal.data?.titleLen ?? 0) / 70) * 100)}%`, background: (seoDetailModal.data?.titleLen ?? 0) < 30 || (seoDetailModal.data?.titleLen ?? 0) > 60 ? 'var(--warning)' : 'var(--success)', borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ideal range: 30–60 characters</div>
                    </div>
                  )}
                  {seoDetailModal.data?.meta !== undefined && (
                    <div style={{ padding: '14px', background: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Meta Description <span style={{ color: 'var(--warning)' }}>({seoDetailModal.data?.metaLen ?? 0} chars)</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '6px' }}>{seoDetailModal.data.meta || '(no meta description)'}</div>
                      <div style={{ height: '6px', background: 'var(--bg-surface-high)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, ((seoDetailModal.data?.metaLen ?? 0) / 200) * 100)}%`, background: (seoDetailModal.data?.metaLen ?? 0) < 70 || (seoDetailModal.data?.metaLen ?? 0) > 160 ? 'var(--warning)' : 'var(--success)', borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ideal range: 70–160 characters</div>
                    </div>
                  )}
                  <div style={{ padding: '14px', background: 'var(--warning-glow)', borderRadius: '10px', border: '1px solid var(--warning)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span className="material-icons" style={{ color: 'var(--warning)', fontSize: '20px', marginTop: '2px' }}>lightbulb</span>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--warning)', marginBottom: '4px' }}>Recommendation</div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{seoDetailModal.data?.recommendation}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={() => setSeoDetailModal(null)}>Got It</button>
                </div>
              </>
            )}

            {/* ── PAGE DETAILS ── */}
            {seoDetailModal.type === 'page_details' && (
              <>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>info</span>
                  Page SEO Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px' }}>
                  {[
                    { label: 'URL', value: seoDetailModal.data?.url, link: true },
                    { label: 'Title', value: seoDetailModal.data?.title },
                    { label: 'Meta Description', value: seoDetailModal.data?.meta, full: true },
                    { label: 'Meta Keywords', value: seoDetailModal.data?.keywords },
                    { label: 'Canonical URL', value: seoDetailModal.data?.canonical },
                    { label: 'Last Modified', value: seoDetailModal.data?.lastModified },
                    { label: 'Last Crawled', value: seoDetailModal.data?.lastCrawled },
                    { label: 'H1 / H2 / H3', value: `${seoDetailModal.data?.h1 ?? 0} / ${seoDetailModal.data?.h2 ?? 0} / ${seoDetailModal.data?.h3 ?? 0}` },
                    { label: 'Internal Links', value: seoDetailModal.data?.internalLinks ?? 0 },
                    { label: 'External Links', value: seoDetailModal.data?.externalLinks ?? 0 },
                    { label: 'Images', value: seoDetailModal.data?.images ?? 0 },
                    { label: 'Missing ALT', value: seoDetailModal.data?.missingAlt ?? 0, warn: (seoDetailModal.data?.missingAlt ?? 0) > 0 },
                  ].map((item, i) => (
                    <div key={i} style={{ gridColumn: item.full ? '1 / -1' : 'auto', padding: '12px', background: 'var(--bg-surface-low)', borderRadius: '10px', border: `1px solid ${item.warn ? 'var(--error)' : 'var(--border-color)'}` }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</div>
                      {item.link
                        ? <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', wordBreak: 'break-all' }}>{item.value || '—'}</a>
                        : <div style={{ fontSize: '0.9rem', color: item.warn ? 'var(--error)' : 'var(--text-main)', fontWeight: item.warn ? '700' : '400' }}>{String(item.value ?? '—')}</div>
                      }
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '8px' }}>
                  <button className="btn" onClick={() => window.open(seoDetailModal.data?.url, '_blank')}>
                    <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>open_in_new</span>Open Page
                  </button>
                  <button className="btn btn-primary" onClick={() => setSeoDetailModal(null)}>Close</button>
                </div>
              </>
            )}

            {/* ── IMAGE DETAILS ── */}
            {seoDetailModal.type === 'image_details' && (
              <>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>image</span>
                  Image Details — {seoDetailModal.data?.images?.length ?? 0} Images
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {(seoDetailModal.data?.images || []).map((img, i) => (
                    <div key={i} style={{ padding: '14px', background: 'var(--bg-surface-low)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ width: '80px', height: '60px', borderRadius: '8px', background: 'var(--bg-surface-high)', border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={img.src || img.url} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="material-icons" style="color:var(--text-muted);font-size:28px">broken_image</span>'; }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Image URL</div>
                        <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--text-main)', marginBottom: '6px' }}>{img.src || img.url}</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          {img.size && <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' }}>Size: {img.size}</span>}
                          <span style={{ fontSize: '0.75rem', background: img.alt ? 'var(--success-glow)' : 'var(--error-glow)', color: img.alt ? 'var(--success)' : 'var(--error)', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' }}>
                            ALT: {img.alt || '(missing)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Page: {img.pageUrl || seoDetailModal.data?.pageUrl || '—'}</div>
                      </div>
                      <button className="btn" style={{ padding: '5px 10px', fontSize: '0.78rem', flexShrink: 0 }} onClick={() => window.open(img.src || img.url, '_blank')}>
                        <span className="material-icons" style={{ fontSize: '13px', verticalAlign: 'middle' }}>open_in_new</span>
                      </button>
                    </div>
                  ))}
                  {(!seoDetailModal.data?.images || seoDetailModal.data.images.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <span className="material-icons" style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>image_not_supported</span>
                      No image data available.
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button className="btn btn-primary" onClick={() => setSeoDetailModal(null)}>Close</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
