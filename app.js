/* ═══════════════════════════════════════
   RentFairly.app — Calculator Logic
═══════════════════════════════════════ */

let totalRent = 0;
let numRooms  = 2;
let roomData  = [];

const COLORS = ['#5B4FE9','#F97316','#22C55E','#F59E0B','#EC4899'];

/* ── DARK MODE ── */
function toggleDark() {
  document.body.classList.toggle('dark');
  const btn = document.querySelector('.dark-toggle');
  btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}
window.addEventListener('load', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    const btn = document.querySelector('.dark-toggle');
    if (btn) btn.textContent = '☀️';
  }
  // load shared result if present
  loadShared();
});

/* ── STEP 1 → 2 ── */
function goToStep2() {
  const val = document.getElementById('total-rent').value;
  if (!val || parseFloat(val) <= 0) { alert('Please enter a valid total rent amount.'); return; }
  totalRent = parseFloat(val);
  numRooms  = parseInt(document.getElementById('num-roommates').value);
  buildRoomForms();
  showStep(2);
}
function goToStep1() { showStep(1); }

/* ── BUILD ROOM FORMS ── */
function buildRoomForms() {
  const c = document.getElementById('rooms-container');
  c.innerHTML = '';
  const names = ['Room A','Room B','Room C','Room D','Room E'];
  for (let i = 0; i < numRooms; i++) {
    c.innerHTML += `
      <div class="room-card">
        <div class="room-card-header">
          <div class="room-number">${i+1}</div>
          <input type="text" id="rname-${i}" placeholder="Name or person (e.g. Alice)" value="${names[i]}" />
        </div>
        <div class="room-fields">
          <div>
            <label class="field-label">📐 Size (sq ft)</label>
            <input type="number" id="sqft-${i}" placeholder="e.g. 150" min="1" />
          </div>
          <div>
            <label class="field-label">🗄️ Closet (sq ft)</label>
            <input type="number" id="closet-${i}" placeholder="e.g. 10" min="0" value="0" />
          </div>
          <div>
            <label class="field-label">☀️ Natural Light</label>
            <div class="star-rating" id="light-${i}">
              ${[1,2,3,4,5].map(n=>`<span class="star" onclick="setStars('light-${i}',${n},'light-val-${i}')">★</span>`).join('')}
            </div>
            <input type="hidden" id="light-val-${i}" value="3"/>
          </div>
          <div>
            <label class="field-label">🔇 Noise (1=quiet)</label>
            <div class="star-rating" id="noise-${i}">
              ${[1,2,3,4,5].map(n=>`<span class="star" onclick="setStars('noise-${i}',${n},'noise-val-${i}')">★</span>`).join('')}
            </div>
            <input type="hidden" id="noise-val-${i}" value="3"/>
          </div>
          <div>
            <label class="field-label">🚿 Private Bathroom?</label>
            <select id="bath-${i}">
              <option value="0">No — shared</option>
              <option value="1">Yes — private</option>
            </select>
          </div>
          <div>
            <label class="field-label">🌿 Extra Perks</label>
            <select id="perks-${i}">
              <option value="0">None</option>
              <option value="1">Balcony / terrace</option>
              <option value="1">Walk-in closet</option>
              <option value="0.5">Extra window</option>
            </select>
          </div>
        </div>
      </div>`;
  }
  for (let i = 0; i < numRooms; i++) {
    setStars(`light-${i}`, 3, `light-val-${i}`);
    setStars(`noise-${i}`, 3, `noise-val-${i}`);
  }
}

function setStars(groupId, value, hiddenId) {
  document.querySelectorAll(`#${groupId} .star`).forEach((s,i) => s.classList.toggle('active', i < value));
  const h = document.getElementById(hiddenId);
  if (h) h.value = value;
}

/* ── CALCULATE ── */
function calculateResults() {
  roomData = [];
  for (let i = 0; i < numRooms; i++) {
    const sqft = parseFloat(document.getElementById(`sqft-${i}`).value);
    if (!sqft || sqft <= 0) { alert(`Please enter the size for room ${i+1}.`); return; }
    const name   = document.getElementById(`rname-${i}`).value.trim() || `Room ${i+1}`;
    const closet = parseFloat(document.getElementById(`closet-${i}`).value) || 0;
    const light  = parseInt(document.getElementById(`light-val-${i}`).value);
    const noise  = parseInt(document.getElementById(`noise-val-${i}`).value);
    const bath   = parseInt(document.getElementById(`bath-${i}`).value);
    const perks  = parseFloat(document.getElementById(`perks-${i}`).value);
    const quiet  = 6 - noise;
    const score  = sqft*0.50 + light*8*0.15 + quiet*8*0.15 + bath*60*0.12 + closet*0.5*0.05 + perks*40*0.03;
    roomData.push({ name, sqft, closet, light, noise, bath, score, color: COLORS[i] });
  }
  const total = roomData.reduce((s,r) => s + r.score, 0);
  const equal = totalRent / numRooms;
  roomData.forEach(r => { r.pct = r.score/total; r.amount = r.pct*totalRent; r.diff = r.amount-equal; });
  renderResults();
  showStep(3);
}

/* ── RENDER RESULTS ── */
function renderResults() {
  const c = document.getElementById('results-container');
  c.innerHTML = '';
  roomData.forEach(r => {
    const diff = r.diff > 1
      ? `<div class="result-diff overpaying">+$${r.diff.toFixed(0)} vs equal split</div>`
      : r.diff < -1
      ? `<div class="result-diff underpaying">−$${Math.abs(r.diff).toFixed(0)} vs equal split</div>`
      : `<div class="result-diff result-equal">≈ Equal split</div>`;
    c.innerHTML += `
      <div class="result-card">
        <div>
          <div style="display:flex;align-items:center;gap:9px;">
            <div style="width:12px;height:12px;border-radius:50%;background:${r.color};flex-shrink:0;box-shadow:0 0 0 3px ${r.color}33;"></div>
            <div class="result-room-name">${r.name}</div>
          </div>
          <div class="result-meta">${r.sqft} sq ft · ${r.bath?'🚿 Private bath':'🚿 Shared bath'} · ${(r.pct*100).toFixed(1)}% of rent</div>
        </div>
        <div class="result-amount">
          <div class="result-price">$${r.amount.toFixed(0)}</div>
          <div class="result-price-sub">per month</div>
          ${diff}
        </div>
      </div>`;
  });
  drawChart();
}

/* ── PIE CHART — crisp, high DPI ── */
function drawChart() {
  const canvas = document.getElementById('pie-chart');
  const DPR    = window.devicePixelRatio || 2;
  const SIZE   = 320;

  // Set actual pixel size for sharpness
  canvas.width  = SIZE * DPR;
  canvas.height = SIZE * DPR;
  canvas.style.width  = SIZE + 'px';
  canvas.style.height = SIZE + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerR = 130;
  const innerR = 52; // donut hole

  let start = -Math.PI / 2;
  ctx.clearRect(0, 0, SIZE, SIZE);

  roomData.forEach((room, idx) => {
    const slice = room.pct * 2 * Math.PI;
    const end   = start + slice;

    // Draw donut slice
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(start), cy + innerR * Math.sin(start));
    ctx.arc(cx, cy, outerR, start, end);
    ctx.arc(cx, cy, innerR, end, start, true);
    ctx.closePath();
    ctx.fillStyle = room.color;
    ctx.fill();

    // Gap between slices
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(start), cy + innerR * Math.sin(start));
    ctx.arc(cx, cy, outerR, start, end);
    ctx.arc(cx, cy, innerR, end, start, true);
    ctx.closePath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Percentage label inside slice
    if (room.pct > 0.06) {
      const mid  = start + slice / 2;
      const labR = (outerR + innerR) / 2;
      const lx   = cx + labR * Math.cos(mid);
      const ly   = cy + labR * Math.sin(mid);
      ctx.fillStyle   = '#ffffff';
      ctx.font        = `bold 15px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${(room.pct*100).toFixed(0)}%`, lx, ly);
    }

    // Room name OUTSIDE — with background pill
    const mid  = start + slice / 2;
    const labR = outerR + 22;
    const nx   = cx + labR * Math.cos(mid);
    const ny   = cy + labR * Math.sin(mid);
    const label = room.name.length > 8 ? room.name.substring(0,8) : room.name;
    ctx.font        = `700 11px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    // shadow for readability
    ctx.shadowColor  = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur   = 4;
    ctx.fillStyle    = '#0D0D12';
    ctx.fillText(label, nx, ny);
    ctx.shadowBlur   = 0;

    start = end;
  });

  // Center donut hole — white circle with FAIR SPLIT text
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 2, 0, 2*Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.fillStyle    = '#5B4FE9';
  ctx.font         = `800 13px 'Plus Jakarta Sans', sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FAIR', cx, cy - 8);
  ctx.fillStyle = '#6E6E85';
  ctx.font      = `600 11px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText('SPLIT', cx, cy + 8);
}

/* ── SHARE ── */
function shareResult() {
  const data = { rent: totalRent, rooms: roomData.map(r => ({ name: r.name, amount: r.amount.toFixed(0), pct: (r.pct*100).toFixed(1) })) };
  const url  = `${location.origin}${location.pathname}?r=${btoa(JSON.stringify(data))}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => alert('✅ Link copied! Share it with your roommates.'));
  } else { prompt('Copy this link:', url); }
}
function shareTwitter() {
  const lines = roomData.map(r => `${r.name}: $${r.amount.toFixed(0)}/mo`).join(' | ');
  const text  = encodeURIComponent(`Just calculated our fair rent split 🏠\n${lines}\nTotal: $${totalRent}/mo\n\nTry it free → https://rentfairly.app`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}
function printResult() { window.print(); }
function startOver()   { document.getElementById('total-rent').value=''; roomData=[]; showStep(1); }

/* ── STEP NAVIGATION ── */
function showStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById(`step-${i}`).classList.toggle('hidden', i!==n);
    const ind = document.getElementById(`step-indicator-${i}`);
    ind.classList.remove('active','done');
    if (i < n) ind.classList.add('done');
    if (i === n) ind.classList.add('active');
  });
  document.getElementById('calculator').scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ── FAQ ── */
function toggleFaq(btn) {
  const ans  = btn.nextElementSibling;
  const icon = btn.querySelector('.faq-icon');
  const open = ans.classList.contains('open');
  document.querySelectorAll('.faq-a').forEach(a=>a.classList.remove('open'));
  document.querySelectorAll('.faq-icon').forEach(s=>s.textContent='+');
  if (!open) { ans.classList.add('open'); icon.textContent='−'; }
}

/* ── LOAD SHARED RESULT FROM URL ── */
function loadShared() {
  const encoded = new URLSearchParams(location.search).get('r');
  if (!encoded) return;
  try {
    const data = JSON.parse(atob(encoded));
    const c    = document.getElementById('results-container');
    c.innerHTML = '<p style="color:#6E6E85;margin-bottom:14px;font-size:0.85rem;">📤 Shared result from your roommate:</p>';
    data.rooms.forEach((r,i) => {
      c.innerHTML += `
        <div class="result-card">
          <div>
            <div style="display:flex;align-items:center;gap:9px;">
              <div style="width:12px;height:12px;border-radius:50%;background:${COLORS[i]};flex-shrink:0;"></div>
              <div class="result-room-name">${r.name}</div>
            </div>
            <div class="result-meta">Fair share: <strong>${r.pct}%</strong> of total rent</div>
          </div>
          <div class="result-amount">
            <div class="result-price">$${r.amount}</div>
            <div class="result-price-sub">per month</div>
          </div>
        </div>`;
    });
    [1,2].forEach(i => document.getElementById(`step-${i}`).classList.add('hidden'));
    document.getElementById('step-3').classList.remove('hidden');
    document.getElementById('step-indicator-3').classList.add('active');
    document.getElementById('calculator').scrollIntoView({ behavior:'smooth' });
  } catch(e) { console.log('Could not parse shared result'); }
}
