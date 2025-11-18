const registrarQueueTable = document.getElementById('registrarQueueTable');
const currentRegistrarDisplay = document.getElementById('currentRegistrarDisplay');
let lastRegistrarId = null;

const scriptURL = "https://script.google.com/macros/s/AKfycby2YOPPvGGDxR63dnq7sWefE84wG3d6_Bh4rFqQm8d0PLmFv6goAwfCFyq8JlB_VaJvIw/exec";

async function fetchRegistrarQueue() {
  try {
    const res = await fetch(scriptURL + "?mode=read&service=Registrar");
    const data = await res.json();

    localStorage.setItem('registrarQueue', JSON.stringify(data.queue || []));
    localStorage.setItem('currentRegistrar', JSON.stringify(data.current || null));

    renderRegistrarQueue();
  } catch (err) {
    console.warn("Unable to fetch from Sheets, using localStorage:", err);
    renderRegistrarQueue();
  }
}

function renderRegistrarQueue() {
  const queue = JSON.parse(localStorage.getItem('registrarQueue')) || [];
  const current = JSON.parse(localStorage.getItem('currentRegistrar')) || null;

  registrarQueueTable.innerHTML = '';

  queue.forEach((student, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.program}</td>
      <td>${student.purpose}</td>
      <td>
          <button class="call-btn" onclick="callRegistrarStudent(${index})">Call</button>
      </td>
    `;
    registrarQueueTable.appendChild(tr);
  });

  if (current) {
    currentRegistrarDisplay.innerHTML = `
      ${current.id}
      <button class="delete-btn" onclick="deleteRegistrarNowServing()">Delete</button>
    `;
    if (current.id !== lastRegistrarId) {
      announceStudent(`Student ID ${pronounceID(current.id)}, please proceed to the Registrar`);
      lastRegistrarId = current.id;
    }
  } else {
    currentRegistrarDisplay.textContent = '---';
  }
}

function callRegistrarStudent(index) {
  const queue = JSON.parse(localStorage.getItem('registrarQueue')) || [];
  const student = queue[index];
  if (student) {
    localStorage.setItem('currentRegistrar', JSON.stringify(student));
    queue.splice(index, 1);
    localStorage.setItem('registrarQueue', JSON.stringify(queue));

    fetch(scriptURL + "?mode=update&service=Registrar", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: "call",
        id: student.id
      })
    });

    renderRegistrarQueue();
  }
}

function deleteRegistrarNowServing() {
  localStorage.removeItem('currentRegistrar');
  lastRegistrarId = null;
  renderRegistrarQueue();

  fetch(scriptURL + "?mode=update&service=Registrar", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: "clear" })
  });
}

fetchRegistrarQueue();
setInterval(fetchRegistrarQueue, 3000);