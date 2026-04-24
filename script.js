// ============================================================
// DegreeShield — Frontend Controller
// ============================================================

// ----- State -----
let currentRole = null;
let globalActivities = [];
let globalFlags = [];
let globalOverrides = {};
let sessionVerifications = 0;
let lastResult = null;
let selectedFile = null;

// ----- Mock Certificate Database -----
const CERTIFICATES_DB = [
  { id: "CERT-2024-001", name: "Aarav Sharma", degree: "B.Tech Computer Science", major: "Computer Science", university: "IIT Delhi", year: 2024, status: "valid", gpa: "8.9" },
  { id: "CERT-2024-002", name: "Priya Patel", degree: "M.Sc Data Science", major: "Data Science", university: "IISc Bangalore", year: 2024, status: "valid", gpa: "9.2" },
  { id: "CERT-2023-003", name: "Rahul Verma", degree: "B.Com Honours", major: "Commerce", university: "SRCC Delhi", year: 2023, status: "valid", gpa: "8.5" },
  { id: "CERT-2024-004", name: "Sneha Gupta", degree: "MBA Finance", major: "Finance", university: "IIM Ahmedabad", year: 2024, status: "valid", gpa: "9.0" },
  { id: "CERT-2023-005", name: "Vikram Singh", degree: "B.Tech Mechanical", major: "Mechanical Engineering", university: "NIT Trichy", year: 2023, status: "pending", gpa: "7.8" },
  { id: "CERT-2022-006", name: "Ananya Reddy", degree: "MBBS", major: "Medicine", university: "AIIMS Delhi", year: 2022, status: "valid", gpa: "8.7" },
  { id: "CERT-2024-007", name: "Karthik Nair", degree: "B.Sc Physics", major: "Physics", university: "St. Stephen's College", year: 2024, status: "valid", gpa: "8.1" },
  { id: "CERT-2023-008", name: "Meera Joshi", degree: "M.Tech AI & ML", major: "Artificial Intelligence", university: "IIIT Hyderabad", year: 2023, status: "valid", gpa: "9.4" },
  { id: "CERT-2024-009", name: "Arjun Kumar", degree: "BBA", major: "Business Administration", university: "Christ University", year: 2024, status: "pending", gpa: "7.5" },
  { id: "CERT-2022-010", name: "Divya Menon", degree: "B.Arch", major: "Architecture", university: "SPA Delhi", year: 2022, status: "revoked", gpa: "8.3" },
  { id: "CERT-2023-011", name: "Rohan Das", degree: "LLB", major: "Law", university: "NLU Delhi", year: 2023, status: "valid", gpa: "8.6" },
  { id: "CERT-2024-012", name: "Ishita Banerjee", degree: "M.Sc Chemistry", major: "Chemistry", university: "JNU Delhi", year: 2024, status: "valid", gpa: "8.8" },
];

// ----- Static Anomalies -----
const STATIC_ANOMALIES = [
  { time: "2024-04-23 14:22", type: "OCR Mismatch", desc: "Degree field parsed as 'B.Tch' instead of 'B.Tech' — possible image corruption", severity: "Medium", status: "investigating" },
  { time: "2024-04-23 09:15", type: "Rate Limit", desc: "IP 192.168.1.45 exceeded 50 requests/min threshold", severity: "Low", status: "auto-resolved" },
  { time: "2024-04-22 18:30", type: "DB Sync Delay", desc: "Certificate sync latency > 2000ms for 3 consecutive batches", severity: "High", status: "monitoring" },
  { time: "2024-04-22 11:05", type: "Trust Score Anomaly", desc: "Document scored 98 trust but contained mismatched university seal", severity: "High", status: "investigating" },
];

// ----- Persistence -----
function saveState() {
  localStorage.setItem('degreeshield_activities', JSON.stringify(globalActivities));
  localStorage.setItem('degreeshield_flags', JSON.stringify(globalFlags));
  localStorage.setItem('degreeshield_overrides', JSON.stringify(globalOverrides));
  localStorage.setItem('degreeshield_session_count', sessionVerifications.toString());
}

function loadState() {
  try {
    globalActivities = JSON.parse(localStorage.getItem('degreeshield_activities')) || [];
    globalFlags = JSON.parse(localStorage.getItem('degreeshield_flags')) || [];
    globalOverrides = JSON.parse(localStorage.getItem('degreeshield_overrides')) || {};
    sessionVerifications = parseInt(localStorage.getItem('degreeshield_session_count') || '0', 10);
  } catch (e) {
    globalActivities = [];
    globalFlags = [];
    globalOverrides = {};
    sessionVerifications = 0;
  }
}

// ----- Toast Notifications -----
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: 'check-circle-2', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
  toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;height:18px;flex-shrink:0;"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons({ nodes: [toast] });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ----- Confetti Celebration -----
function launchConfetti() {
  const colors = ['#00d4ff', '#7c3aed', '#00e676', '#ffaa00', '#ff3d71', '#38e8ff'];
  const container = document.body;
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position:fixed; z-index:9999; pointer-events:none;
      width:${6 + Math.random() * 6}px; height:${6 + Math.random() * 6}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      left:${Math.random() * 100}vw; top:-10px;
      opacity:1; transition: none;
    `;
    container.appendChild(particle);
    const destX = (Math.random() - 0.5) * 200;
    const destY = window.innerHeight + 20;
    const rot = Math.random() * 720;
    const dur = 1500 + Math.random() * 1500;
    particle.animate([
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${destX}px, ${destY}px) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: dur, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' })
    .onfinish = () => particle.remove();
  }
}

// ----- Activity Logging -----
function addActivity(text, color = 'blue') {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  globalActivities.unshift({ text, color, time: timeStr, timestamp: now.toISOString() });
  if (globalActivities.length > 50) globalActivities.pop();
  saveState();
}

function renderActivities(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  if (globalActivities.length === 0) {
    list.innerHTML = '<li class="activity-item"><span class="activity-dot blue"></span>No activity yet — upload a document to begin.<span class="activity-time">now</span></li>';
    return;
  }
  list.innerHTML = globalActivities.slice(0, 15).map(a =>
    `<li class="activity-item"><span class="activity-dot ${a.color}"></span>${a.text}<span class="activity-time">${a.time}</span></li>`
  ).join('');
}

function clearActivities() {
  globalActivities = [];
  saveState();
  renderActivities('user-activity-list');
  showToast('Activity log cleared', 'info');
}

// ----- Role Management -----
let pendingRole = null;

// Mock credentials for each role
const CREDENTIALS = {
  user: { email: 'student@degreeshield.com', password: 'student123' },
  institution: { email: 'admin@university.edu', password: 'inst2024' },
  admin: { email: 'admin@degreeshield.com', password: 'admin2024' },
};

const ROLE_CONFIG = {
  user: {
    title: 'Student Login',
    desc: 'Sign in to verify your certificates',
    icon: 'graduation-cap',
    iconBg: 'var(--primary-glow)',
    iconColor: 'var(--primary)',
    hint: 'Demo: student@degreeshield.com / student123',
  },
  institution: {
    title: 'Institution Login',
    desc: 'Access your credential management portal',
    icon: 'building-2',
    iconBg: 'var(--success-glow)',
    iconColor: 'var(--success)',
    hint: 'Demo: admin@university.edu / inst2024',
  },
  admin: {
    title: 'Admin Login',
    desc: 'Platform oversight & system analytics',
    icon: 'shield',
    iconBg: 'var(--danger-glow)',
    iconColor: 'var(--danger)',
    hint: 'Demo: admin@degreeshield.com / admin2024',
  },
};

function showLoginForm(role) {
  pendingRole = role;
  const config = ROLE_CONFIG[role];

  document.getElementById('login-step-role').style.display = 'none';
  const formCard = document.getElementById('login-step-form');
  formCard.style.display = 'block';
  formCard.style.animation = 'fadeInUp 0.4s ease both';

  document.getElementById('login-form-title').textContent = config.title;
  document.getElementById('login-form-desc').textContent = config.desc;
  document.getElementById('login-hint').textContent = config.hint;

  const iconEl = document.getElementById('login-form-icon');
  iconEl.innerHTML = `<i data-lucide="${config.icon}"></i>`;
  iconEl.style.background = config.iconBg;
  iconEl.style.color = config.iconColor;

  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-email').focus();

  lucide.createIcons();
}

function showRolePicker() {
  document.getElementById('login-step-form').style.display = 'none';
  const roleCard = document.getElementById('login-step-role');
  roleCard.style.display = 'block';
  roleCard.style.animation = 'fadeInUp 0.4s ease both';
  pendingRole = null;
  lucide.createIcons();
}

function handleLogin(event) {
  event.preventDefault();
  if (!pendingRole) return;

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const creds = CREDENTIALS[pendingRole];

  if (email === creds.email && password === creds.password) {
    loginAs(pendingRole);
  } else {
    showToast('Invalid credentials — check the hint below 👇', 'error');
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
  }
}

function togglePassword() {
  const input = document.getElementById('login-password');
  const icon = document.getElementById('pw-toggle-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

function loginAs(role) {
  currentRole = role;
  switchView(role);
  const names = { user: 'Verifier', institution: 'Institution', admin: 'Administrator' };
  const greetings = {
    user: 'Hey there! Ready to verify some docs? 🚀',
    institution: 'Welcome back to your portal! 🏛️',
    admin: 'Admin mode activated 🛡️'
  };
  document.getElementById('role-badge').textContent = names[role];
  document.getElementById('role-badge').style.display = 'inline-flex';
  document.getElementById('btn-logout').style.display = 'inline-flex';
  addActivity(`Logged in as ${names[role]}`, 'blue');
  setupDashboard(role);
  showToast(greetings[role], 'success');
}

function logout() {
  currentRole = null;
  pendingRole = null;
  switchView('login');
  document.getElementById('role-badge').style.display = 'none';
  document.getElementById('btn-logout').style.display = 'none';
  resetUpload();
  // Reset login to role picker
  showRolePicker();
  showToast('See you soon! 👋', 'info');
}

function switchView(role) {
  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
  const viewId = role === 'login' ? 'view-login' : `view-${role}`;
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = '';
  }
}

function setupDashboard(role) {
  if (role === 'user') {
    updateUserStats();
    renderActivities('user-activity-list');
  } else if (role === 'institution') {
    renderCertificateTable();
  } else if (role === 'admin') {
    updateAdminStats();
    renderTrafficChart();
    renderAnomalies();
    renderAuditLog();
  }
  setTimeout(() => lucide.createIcons(), 100);
}

// ----- Data Particles (login background) -----
function initDataParticles() {
  const container = document.getElementById('data-particles');
  if (!container) return;
  const colors = ['#6366f1', '#a855f7', '#06b6d4', '#10b981'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'data-particle';
    const size = 3 + Math.random() * 5;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay:${Math.random() * 8}s;
      animation-duration:${6 + Math.random() * 6}s;
    `;
    container.appendChild(p);
  }
}

// ============================================================
//  USER / VERIFIER DASHBOARD
// ============================================================

function updateUserStats() {
  const verified = globalActivities.filter(a => a.text.includes('verified') || a.text.includes('Verified')).length;
  const flagged = globalFlags.length;
  document.getElementById('user-total-scans').textContent = sessionVerifications;
  document.getElementById('user-verified').textContent = verified;
  document.getElementById('user-flagged').textContent = flagged;
}

// ----- File Upload -----
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) { showToast('File exceeds 10MB limit', 'error'); return; }
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!allowed.includes(file.type)) { showToast('Unsupported file format', 'error'); return; }
  selectedFile = file;
  document.getElementById('selected-file').style.display = 'block';
  document.getElementById('selected-file-name').textContent = file.name;
  document.getElementById('results-panel').classList.remove('active');
  lucide.createIcons();
  addActivity(`Selected file: ${file.name}`, 'blue');
}

// Drag & Drop
(function setupDragDrop() {
  document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('upload-zone');
    if (!zone) return;
    ['dragenter', 'dragover'].forEach(e => zone.addEventListener(e, (ev) => { ev.preventDefault(); zone.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(e => zone.addEventListener(e, (ev) => { ev.preventDefault(); zone.classList.remove('drag-over'); }));
    zone.addEventListener('drop', (ev) => {
      const file = ev.dataTransfer.files[0];
      if (file) {
        const input = document.getElementById('file-input');
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileUpload({ target: input });
      }
    });
  });
})();

// ----- Simulated Verification -----
function runVerification() {
  if (!selectedFile) { showToast('Oops — pick a file first!', 'warning'); return; }

  showToast('🔍 Scanning with AI magic...', 'info');
  addActivity(`Verification started for: ${selectedFile.name}`, 'blue');

  // Simulate processing delay
  const resultsPanel = document.getElementById('results-panel');
  resultsPanel.classList.add('active');

  // Generate mock result
  const mockNames = ["Aarav Sharma", "Priya Patel", "Rahul Verma", "Sneha Gupta", "Meera Joshi", "Arjun Kumar"];
  const mockDegrees = ["B.Tech Computer Science", "M.Sc Data Science", "MBA Finance", "B.Sc Physics", "M.Tech AI & ML"];
  const mockUnivs = ["IIT Delhi", "IISc Bangalore", "IIM Ahmedabad", "NIT Trichy", "IIIT Hyderabad"];
  const mockIDs = ["CERT-2024-001", "CERT-2024-002", "CERT-2023-003", "CERT-2024-004", "CERT-2023-008"];

  const ri = Math.floor(Math.random() * mockNames.length);
  const trustScore = Math.floor(Math.random() * 40) + 60; // 60-99
  const issues = [];

  if (trustScore < 75) {
    issues.push("University seal pattern does not match official template");
    issues.push("Font inconsistency detected in degree title field");
  }
  if (trustScore < 85) {
    issues.push("Minor metadata discrepancy in document creation date");
  }

  const dbMatch = trustScore > 80 ? CERTIFICATES_DB[ri % CERTIFICATES_DB.length] : null;

  lastResult = {
    fileName: selectedFile.name,
    trustScore,
    name: mockNames[ri % mockNames.length],
    degree: mockDegrees[ri % mockDegrees.length],
    university: mockUnivs[ri % mockUnivs.length],
    certId: mockIDs[ri % mockIDs.length],
    year: 2023 + (ri % 2),
    issues,
    dbMatch: dbMatch ? "✅ Found — Record Verified" : "❌ No Match Found",
    timestamp: new Date().toISOString(),
  };

  sessionVerifications++;
  saveState();

  // Animate results after a short delay
  setTimeout(() => renderResults(lastResult), 600);
}

function renderResults(result) {
  // Trust Score Ring
  const circumference = 2 * Math.PI * 58; // ~364.42
  const offset = circumference - (result.trustScore / 100) * circumference;
  const ringFill = document.getElementById('trust-ring-fill');
  let strokeColor = '#10b981';
  if (result.trustScore < 70) strokeColor = '#ef4444';
  else if (result.trustScore < 85) strokeColor = '#f59e0b';
  ringFill.style.stroke = strokeColor;
  ringFill.style.strokeDashoffset = offset;

  // Animate score number
  animateNumber('trust-score-text', result.trustScore);

  // Verdict
  const verdict = document.getElementById('trust-verdict');
  const statusBadge = document.getElementById('result-status-badge');
  if (result.trustScore >= 85) {
    verdict.className = 'verdict legit';
    verdict.innerHTML = '<i data-lucide="check-circle-2" style="width:16px;height:16px;"></i> Likely Authentic';
    statusBadge.className = 'status-badge valid';
    statusBadge.textContent = 'Verified';
    document.getElementById('trust-summary').textContent = 'Document passes authenticity checks with high confidence.';
  } else if (result.trustScore >= 70) {
    verdict.className = 'verdict suspicious';
    verdict.innerHTML = '<i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Needs Review';
    statusBadge.className = 'status-badge pending';
    statusBadge.textContent = 'Review Needed';
    document.getElementById('trust-summary').textContent = 'Some discrepancies detected — manual review recommended.';
  } else {
    verdict.className = 'verdict fake';
    verdict.innerHTML = '<i data-lucide="x-circle" style="width:16px;height:16px;"></i> Suspicious Document';
    statusBadge.className = 'status-badge invalid';
    statusBadge.textContent = 'Suspicious';
    document.getElementById('trust-summary').textContent = 'Multiple red flags detected — document may be fraudulent.';
  }

  // Parsed data
  const grid = document.getElementById('parsed-data-grid');
  grid.innerHTML = [
    { label: 'Full Name', value: result.name },
    { label: 'Degree', value: result.degree },
    { label: 'University', value: result.university },
    { label: 'Certificate ID', value: result.certId },
    { label: 'Year of Issue', value: result.year },
    { label: 'Database Match', value: result.dbMatch },
  ].map(d => `<div class="parsed-item"><div class="label">${d.label}</div><div class="value">${d.value}</div></div>`).join('');

  // Issues
  const issuesSec = document.getElementById('issues-section');
  const issuesList = document.getElementById('issues-list');
  if (result.issues.length > 0) {
    issuesSec.style.display = 'block';
    issuesList.innerHTML = result.issues.map(i =>
      `<li><i data-lucide="alert-circle" style="width:16px;height:16px;"></i>${i}</li>`
    ).join('');
  } else {
    issuesSec.style.display = 'none';
  }

  const verdictLabel = result.trustScore >= 85 ? 'verified as authentic' : result.trustScore >= 70 ? 'flagged for review' : 'marked suspicious';
  addActivity(`Document "${result.fileName}" ${verdictLabel} (Score: ${result.trustScore})`, result.trustScore >= 85 ? 'green' : result.trustScore >= 70 ? 'yellow' : 'red');

  updateUserStats();
  renderActivities('user-activity-list');

  lucide.createIcons();

  // Celebration feedback
  if (result.trustScore >= 85) {
    showToast('🎉 Looking good! Document verified successfully!', 'success');
    launchConfetti();
  } else if (result.trustScore >= 70) {
    showToast('🤔 Hmm, a few things need a closer look.', 'warning');
  } else {
    showToast('⚠️ Heads up — this one looks suspicious.', 'error');
  }
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  let current = 0;
  const step = Math.ceil(target / 40);
  const interval = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(interval); }
    el.textContent = current;
  }, 30);
}

function resetUpload() {
  selectedFile = null;
  lastResult = null;
  document.getElementById('file-input').value = '';
  document.getElementById('selected-file').style.display = 'none';
  document.getElementById('results-panel').classList.remove('active');
  // Reset trust ring
  document.getElementById('trust-ring-fill').style.strokeDashoffset = 364.42;
  document.getElementById('trust-score-text').textContent = '0';
}

// ----- Download Report -----
function downloadReport() {
  if (!lastResult) { showToast('No verification result to download', 'warning'); return; }
  const r = lastResult;
  const lines = [
    '═══════════════════════════════════════════',
    '  DEGREESHIELD — VERIFICATION AUDIT REPORT',
    '═══════════════════════════════════════════',
    '',
    `Report Generated: ${new Date().toLocaleString()}`,
    `Document: ${r.fileName}`,
    '',
    '── TRUST SCORE ──────────────────────────',
    `  Score: ${r.trustScore}/100`,
    `  Verdict: ${r.trustScore >= 85 ? 'AUTHENTIC' : r.trustScore >= 70 ? 'NEEDS REVIEW' : 'SUSPICIOUS'}`,
    '',
    '── EXTRACTED DATA ──────────────────────',
    `  Name: ${r.name}`,
    `  Degree: ${r.degree}`,
    `  University: ${r.university}`,
    `  Certificate ID: ${r.certId}`,
    `  Year: ${r.year}`,
    `  Database Match: ${r.dbMatch}`,
    '',
  ];
  if (r.issues.length > 0) {
    lines.push('── ISSUES DETECTED ─────────────────────');
    r.issues.forEach((issue, i) => lines.push(`  ${i + 1}. ${issue}`));
    lines.push('');
  }
  lines.push('═══════════════════════════════════════════');
  lines.push('  End of Report — DegreeShield Platform');
  lines.push('═══════════════════════════════════════════');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DegreeShield_Report_${r.certId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  addActivity(`Downloaded audit report for ${r.certId}`, 'green');
  renderActivities('user-activity-list');
  showToast('📄 Report saved — nice!', 'success');
}

// ----- Flag for Review -----
function flagForReview() {
  if (!lastResult) { showToast('No result to flag', 'warning'); return; }
  const flag = {
    time: new Date().toLocaleString(),
    type: 'User Flag',
    desc: `Document "${lastResult.fileName}" flagged — Trust Score: ${lastResult.trustScore}, Cert ID: ${lastResult.certId}`,
    severity: lastResult.trustScore < 70 ? 'High' : 'Medium',
    status: 'pending',
  };
  globalFlags.push(flag);
  saveState();
  addActivity(`Flagged "${lastResult.fileName}" for admin review`, 'red');
  updateUserStats();
  renderActivities('user-activity-list');
  showToast('🚩 Flagged! The admin team will take a look.', 'warning');
}

// ============================================================
//  INSTITUTION DASHBOARD
// ============================================================

function renderCertificateTable(filter = '') {
  const tbody = document.getElementById('cert-table-body');
  if (!tbody) return;
  const filterLower = filter.toLowerCase();
  const filtered = CERTIFICATES_DB.filter(c =>
    c.id.toLowerCase().includes(filterLower) ||
    c.name.toLowerCase().includes(filterLower) ||
    c.degree.toLowerCase().includes(filterLower)
  );

  tbody.innerHTML = filtered.map(c => {
    const overriddenStatus = globalOverrides[c.id] || c.status;
    const badgeClass = overriddenStatus === 'valid' ? 'valid' : overriddenStatus === 'revoked' ? 'invalid' : 'pending';
    const overrideLabel = globalOverrides[c.id] ? ' (Override)' : '';
    return `<tr>
      <td><strong>${c.id}</strong></td>
      <td>${c.name}</td>
      <td>${c.degree}</td>
      <td>${c.year}</td>
      <td><span class="status-badge ${badgeClass}">${overriddenStatus}${overrideLabel}</span></td>
      <td>
        <select class="form-select" style="width:120px;padding:6px 10px;font-size:0.8rem;" onchange="overrideStatus('${c.id}', this.value)">
          <option value="valid" ${overriddenStatus === 'valid' ? 'selected' : ''}>Valid</option>
          <option value="pending" ${overriddenStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="revoked" ${overriddenStatus === 'revoked' ? 'selected' : ''}>Revoked</option>
        </select>
      </td>
    </tr>`;
  }).join('');
}

function filterCertificates() {
  const q = document.getElementById('cert-search').value;
  renderCertificateTable(q);
}

function overrideStatus(certId, newStatus) {
  const cert = CERTIFICATES_DB.find(c => c.id === certId);
  if (!cert) return;
  if (newStatus === cert.status) {
    delete globalOverrides[certId];
  } else {
    globalOverrides[certId] = newStatus;
  }
  saveState();
  renderCertificateTable(document.getElementById('cert-search')?.value || '');
  addActivity(`Institution override: ${certId} set to "${newStatus}"`, 'yellow');
  showToast(`✅ ${certId} updated to ${newStatus}`, 'success');
}

// ----- Bulk Upload -----
function showBulkUploadModal() {
  document.getElementById('bulk-upload-modal').classList.add('active');
  document.getElementById('bulk-progress').style.display = 'none';
  lucide.createIcons();
}

function closeBulkUploadModal() {
  document.getElementById('bulk-upload-modal').classList.remove('active');
}

function handleBulkUpload(event) {
  const files = event.target.files;
  if (!files.length) return;

  const progressDiv = document.getElementById('bulk-progress');
  const progressFill = document.getElementById('bulk-progress-fill');
  const progressLabel = document.getElementById('bulk-progress-label');
  progressDiv.style.display = 'block';

  const stages = [
    { label: 'Parsing files...', width: '30%', delay: 800 },
    { label: 'Extracting data...', width: '55%', delay: 1500 },
    { label: 'Syncing to database...', width: '80%', delay: 2200 },
    { label: 'Confirmed — Records imported!', width: '100%', delay: 3000 },
  ];

  stages.forEach((stage, i) => {
    setTimeout(() => {
      progressLabel.textContent = stage.label;
      progressFill.style.width = stage.width;
      if (i === stages.length - 1) {
        addActivity(`Bulk import: ${files.length} file(s) processed successfully`, 'green');
        showToast(`${files.length} file(s) imported successfully!`, 'success');
        setTimeout(() => {
          closeBulkUploadModal();
          renderCertificateTable();
        }, 1000);
      }
    }, stage.delay);
  });
}

// ============================================================
//  ADMIN DASHBOARD
// ============================================================

function updateAdminStats() {
  const totalVerifications = 1420 + sessionVerifications;
  document.getElementById('admin-total-verifications').textContent = totalVerifications.toLocaleString();
  const totalAnomalies = STATIC_ANOMALIES.length + globalFlags.length;
  document.getElementById('admin-anomalies').textContent = totalAnomalies;
  document.getElementById('anomaly-count-badge').textContent = `${totalAnomalies} Active`;
}

function renderTrafficChart() {
  const chart = document.getElementById('traffic-chart');
  if (!chart) return;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [180, 245, 198, 312, 287, 156, 203 + sessionVerifications];
  const maxVal = Math.max(...values);

  chart.innerHTML = days.map((day, i) => {
    const height = Math.max(8, (values[i] / maxVal) * 160);
    return `<div class="chart-bar" style="height:${height}px;animation-delay:${i * 0.1}s;">
      <span class="bar-value">${values[i]}</span>
      <span class="bar-label">${day}</span>
    </div>`;
  }).join('');
}

function renderAnomalies() {
  const tbody = document.getElementById('anomaly-table-body');
  if (!tbody) return;

  // Merge static + user flags
  const allAnomalies = [
    ...globalFlags.map(f => ({
      time: f.time,
      type: f.type,
      desc: f.desc,
      severity: f.severity,
      status: f.status,
    })),
    ...STATIC_ANOMALIES,
  ];

  tbody.innerHTML = allAnomalies.map(a => {
    const sevClass = a.severity === 'High' ? 'invalid' : a.severity === 'Medium' ? 'pending' : 'valid';
    const statusClass = a.status === 'pending' ? 'pending' : a.status === 'investigating' ? 'pending' : a.status === 'monitoring' ? 'pending' : 'valid';
    return `<tr>
      <td style="white-space:nowrap;">${a.time}</td>
      <td><strong>${a.type}</strong></td>
      <td style="max-width:300px;">${a.desc}</td>
      <td><span class="status-badge ${sevClass}">${a.severity}</span></td>
      <td><span class="status-badge ${statusClass}">${a.status}</span></td>
    </tr>`;
  }).join('');
}

function renderAuditLog() {
  const list = document.getElementById('admin-audit-log');
  if (!list) return;
  const allLogs = [
    ...globalActivities.slice(0, 10),
    { text: 'System health check completed — all services nominal', color: 'green', time: '09:00 AM' },
    { text: 'Database backup initiated (automated)', color: 'blue', time: '06:00 AM' },
    { text: 'OCR service updated to v3.2.1', color: 'blue', time: 'Yesterday' },
    { text: 'Rate limiter threshold adjusted: 50 → 75 req/min', color: 'yellow', time: 'Yesterday' },
  ];

  list.innerHTML = allLogs.slice(0, 15).map(a =>
    `<li class="activity-item"><span class="activity-dot ${a.color}"></span>${a.text}<span class="activity-time">${a.time}</span></li>`
  ).join('');
}

// ============================================================
//  INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  lucide.createIcons();
  initDataParticles();
});
