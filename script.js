document.querySelectorAll('.home-nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

function openSystem() {
  const homePage = document.getElementById('home-page');
  homePage.classList.add('fade-out');

  const systemPage = document.getElementById('system-page');
  systemPage.style.display = 'block';
  systemPage.classList.add('fade');

  goTo('services'); 
  currentService = "";

  setTimeout(() => {
    homePage.style.display = 'none';
    homePage.classList.remove('fade-out');
  }, 100);
}

function closeSystem() {
  const systemPage = document.getElementById('system-page');
  systemPage.classList.remove('fade');
  systemPage.classList.add('fade-out');

  setTimeout(() => {
    systemPage.style.display = 'none';
    const homePage = document.getElementById('home-page');
    homePage.style.display = 'flex'; 
    homePage.classList.remove('fade-out');
    homePage.classList.add('fade');
    document.body.style.background = ''; 
    window.scrollTo(0, 0);
  }, 100);
}

function updateClockAll() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString();
  ["clock", "clock2", "clock4", "clock5", "clock6"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = `${time} ${date}`;
  });
}
setInterval(updateClockAll, 1000);
updateClockAll();

function goTo(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

let currentService = "";

function selectService(service) {
  currentService = service;

  if (service === "Registrar") {
    setupFormForRegistrar();
  } else {
    setupFormForGuidance();
  }
  goTo('formPage');
}

function setupFormForRegistrar() {
  const purposeEl = document.getElementById('purpose');
  purposeEl.innerHTML = '';

  const registrarOptions = [
    "Document Request",
    "Document Pickup",
    "Authentication",
    "Issuance of Form"
  ];

  registrarOptions.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    purposeEl.appendChild(opt);
  });

  document.getElementById('formTitle').innerText = `Fill Your Details (Registrar)`;
}

function setupFormForGuidance() {
  const purposeEl = document.getElementById('purpose');
  purposeEl.innerHTML = '';
  ["Consultation", "Meeting"].forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    purposeEl.appendChild(opt);
  });
  document.getElementById('formTitle').innerText = `Fill Your Details (Guidance)`;
}

function goBackFromForm() {
  goTo('services');
}

function submitForm() {
  const name = document.getElementById('name').value.trim();
  const idNum = document.getElementById('idNumber').value.trim();
  const program = document.getElementById('program').value.trim();
  const purpose = document.getElementById('purpose').value;
  const errorEl = document.getElementById('errorMsg');
  errorEl.innerText = '';

  if (!name || !idNum || !program || !purpose) {
    errorEl.innerText = "Please fill in all fields.";
    return;
  }

  const queueNumber = idNum;

  document.getElementById('queueNumber').innerText = `${queueNumber}`;
  goTo('queueResult');

  const studentData = {
    name: name,
    id: idNum,
    program: program,
    service: currentService,
    purpose: purpose
  };

  const scriptURL = "https://script.google.com/macros/s/AKfycby2YOPPvGGDxR63dnq7sWefE84wG3d6_Bh4rFqQm8d0PLmFv6goAwfCFyq8JlB_VaJvIw/exec";

  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  })
  .then(() => console.log("Data sent to Google Sheets"))
  .catch(err => console.error("Error sending to Google Sheets:", err));

  let queueKey = currentService === "Registrar" ? 'registrarQueue' : 'guidanceQueue';
  let queue = JSON.parse(localStorage.getItem(queueKey)) || [];
  queue.push(studentData);
  localStorage.setItem(queueKey, JSON.stringify(queue));
}


function reset() {
  document.getElementById('name').value = '';
  document.getElementById('idNumber').value = '';
  document.getElementById('program').value = '';
  document.getElementById('purpose').innerHTML = '<option value="">Select Purpose</option>';

  currentService = "";

  closeSystem();
}

function scheduleDailyReset() {
  const now = new Date();
  const nextReset = new Date();
  nextReset.setHours(23, 59, 0, 0);

  if (now > nextReset) {
    nextReset.setDate(nextReset.getDate() + 1);
  }

  const timeout = nextReset - now;

  setTimeout(() => {
    localStorage.removeItem('registrarQueue');
    localStorage.removeItem('guidanceQueue');
    localStorage.removeItem('currentRegistrar');
    localStorage.removeItem('currentGuidance');

    console.log('Daily queues reset at 11:59 PM');
    scheduleDailyReset();
  }, timeout);
}

scheduleDailyReset();