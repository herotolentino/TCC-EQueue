const guidanceQueueTable = document.getElementById('guidanceQueueTable');
const currentGuidanceDisplay = document.getElementById('currentGuidanceDisplay');
let lastGuidanceId = null;

const scriptURL = "https://script.google.com/macros/s/AKfycby2YOPPvGGDxR63dnq7sWefE84wG3d6_Bh4rFqQm8d0PLmFv6goAwfCFyq8JlB_VaJvIw/exec";

async function fetchGuidanceQueue() {
  try {
    const res = await fetch(scriptURL + "?mode=read&service=Guidance");
    const data = await res.json();

    localStorage.setItem('guidanceQueue', JSON.stringify(data.queue || []));
    localStorage.setItem('currentGuidance', JSON.stringify(data.current || null));

    renderGuidanceQueue();
  } catch (err) {
    console.warn("Unable to fetch from Sheets, using localStorage:", err);
    renderGuidanceQueue();
  }
}

function renderGuidanceQueue() {
  const queue = JSON.parse(localStorage.getItem('guidanceQueue')) || [];
  const current = JSON.parse(localStorage.getItem('currentGuidance')) || null;

  guidanceQueueTable.innerHTML = '';

  queue.forEach((student, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.program}</td>
      <td>${student.purpose}</td>
      <td>
          <button class="call-btn" onclick="callGuidanceStudent(${index})">Call</button>
      </td>
    `;
    guidanceQueueTable.appendChild(tr);
  });

  if (current) {
    currentGuidanceDisplay.innerHTML = `
      ${current.id}
      <button class="delete-btn" onclick="deleteGuidanceNowServing()">Delete</button>
    `;
    if (current.id !== lastGuidanceId) {
      announceStudent(`Student ID ${pronounceID(current.id)}, please proceed to the Guidance`);
      lastGuidanceId = current.id;
    }
  } else {
    currentGuidanceDisplay.textContent = '---';
  }
}

function callGuidanceStudent(index) {
  const queue = JSON.parse(localStorage.getItem('guidanceQueue')) || [];
  const student = queue[index];
  if (student) {
    localStorage.setItem('currentGuidance', JSON.stringify(student));
    queue.splice(index, 1);
    localStorage.setItem('guidanceQueue', JSON.stringify(queue));

    fetch(scriptURL + "?mode=update&service=Guidance", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: "call",
        id: student.id
      })
    });

    renderGuidanceQueue();
  }
}

function deleteGuidanceNowServing() {
  localStorage.removeItem('currentGuidance');
  lastGuidanceId = null;
  renderGuidanceQueue();

  
  fetch(scriptURL + "?mode=update&service=Guidance", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: "clear" })
  });
}

fetchGuidanceQueue();
setInterval(fetchGuidanceQueue, 3000);