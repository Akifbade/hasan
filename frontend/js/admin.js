// Admin Dashboard JavaScript
const API_BASE = '/api';
let currentInvoice = null;

// Service line item templates
const serviceTemplates = [
  { en: 'Delivery Order', ar: 'اذن تسليم' },
  { en: 'Customs Duty', ar: 'رسوم جمركية' },
  { en: 'Stevedoring Charges', ar: 'اجور مناولة الميناء' },
  { en: 'Global Charges', ar: 'اجور جلوبال' },
  { en: 'Freight Charges', ar: 'اجور شحن' },
  { en: 'Handling Charges KAC', ar: 'رسوم خدمات كويتية وناشيونال' },
  { en: 'Port Demmuragex', ar: 'ارضية الميناء' },
  { en: 'Ship Agent Demmurage', ar: 'ارضية وكيل الملاحة' },
  { en: 'Municipality Charges', ar: 'اجور متابعة البلدية' },
  { en: 'Customs Inspection Fees', ar: 'كشف وتفتيش جمركي' },
  { en: 'Transport Charges', ar: 'اجور نقل' },
  { en: 'Labour/Packing Charges', ar: 'اجور عمال / تغليف وتربيط' },
  { en: 'Agriculture', ar: 'اجور افراجات زراعية' },
  { en: 'Delivery Good Service', ar: 'اجور استلام' },
  { en: 'Forklift/Crain Charges', ar: 'اجور رافعة كرين' },
  { en: 'Authorities/Certificates Releases', ar: 'افراجات حكومية (تجارة وبلدية)' },
  { en: 'Customs Clearing Charges', ar: 'اجور تخليص' },
  { en: 'Delivery Policy Charges', ar: 'اجور استلام بوليصة' },
  { en: 'Bank Commissions', ar: 'عمولة بنكية' },
  { en: 'Printing/Copy', ar: 'تصديق وزارة الخارجية' },
  { en: 'Stamping Foreign Affairs', ar: 'تصديق وزارة الخارجية' },
  { en: 'Computer Description', ar: 'بيان كمبيوتر' },
  { en: 'Other Expenses', ar: 'مصروفات اخرى' }
];

// Auth
function getToken() {
  return localStorage.getItem('auth_token');
}

function setToken(token) {
  localStorage.setItem('auth_token', token);
}

function clearToken() {
  localStorage.removeItem('auth_token');
}

async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    clearToken();
    showLogin();
    throw new Error('Unauthorized');
  }
  
  return response.json();
}

// UI Functions
function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-app').classList.add('hidden');
}

function showAdmin() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');
  loadDashboard();
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`${viewName}-view`).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

  const titles = { dashboard: 'Dashboard', invoices: 'Invoices', create: 'New Invoice', blank: 'Blank Invoice', messages: 'Contact Messages', settings: 'Settings' };
  document.getElementById('page-title').textContent = titles[viewName] || viewName;

  if (viewName === 'invoices') loadInvoices();
  if (viewName === 'create') prepareNewInvoice();
  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'messages') loadMessages();
  if (viewName === 'settings') loadSettings();
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  
  try {
    const data = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(r => r.json());
    
    if (data.error) {
      errorEl.textContent = data.error;
      return;
    }
    
    setToken(data.token);
    document.getElementById('user-name').textContent = data.user.name;
    showAdmin();
  } catch (err) {
    errorEl.textContent = 'Login failed. Please try again.';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  clearToken();
  showLogin();
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showView(item.dataset.view);
  });
});

// Mobile menu
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('active');
});

// Dashboard
async function loadDashboard() {
  try {
    const { invoices, total } = await fetchAPI('/invoices?limit=1000');

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0);

    document.getElementById('total-invoices').textContent = total;
    document.getElementById('total-revenue').textContent = totalRevenue.toFixed(3);
    document.getElementById('total-balance').textContent = totalBalance.toFixed(3);

    // Recent invoices
    const recentEl = document.getElementById('recent-invoices');
    recentEl.innerHTML = invoices.slice(0, 5).map(inv => createInvoiceItem(inv)).join('');
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// Contact Messages
async function loadMessages() {
  try {
    const messages = await fetchAPI('/contact');
    const listEl = document.getElementById('messages-list');

    if (messages.length === 0) {
      listEl.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">No messages found</p>';
      return;
    }

    listEl.innerHTML = messages.map(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      const statusClass = msg.status === 'new' ? 'style="background:var(--warning)"' : '';
      return `
        <div class="invoice-item">
          <div class="invoice-number">#${msg.id}</div>
          <div class="invoice-customer">
            <strong>${msg.name}</strong>
            <span>${msg.email} | ${msg.phone || 'No phone'}</span>
            <span>${date}</span>
          </div>
          <div class="invoice-amount">
            <span class="badge" ${statusClass}>${msg.status}</span>
          </div>
          <div class="invoice-actions">
            <button class="btn-icon" onclick="viewMessage(${msg.id})" title="View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="btn-icon danger" onclick="deleteMessage(${msg.id})" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Load messages error:', err);
  }
}

async function viewMessage(id) {
  try {
    const messages = await fetchAPI('/contact');
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    const date = new Date(msg.createdAt).toLocaleString();

    // Mark as read
    if (msg.status === 'new') {
      await fetchAPI(`/contact/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'read' })
      });
      loadMessages();
    }

    // Show in a formatted way
    const modalHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;">
        <div style="background:white;padding:30px;border-radius:12px;max-width:500px;width:90%;max-height:80vh;overflow:auto;">
          <h3 style="margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:10px;">Message #${msg.id}</h3>
          <p><strong>Name:</strong> ${msg.name}</p>
          <p><strong>Email:</strong> ${msg.email}</p>
          <p><strong>Phone:</strong> ${msg.phone || 'N/A'}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Status:</strong> ${msg.status}</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap;background:#f5f5f5;padding:15px;border-radius:8px;">${msg.message}</p>
          <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
            <button class="btn btn-outline" onclick="document.getElementById('message-modal').remove()">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } catch (err) {
    console.error('View message error:', err);
    alert('Failed to load message');
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await fetchAPI(`/contact/${id}`, { method: 'DELETE' });
    loadMessages();
  } catch (err) {
    console.error('Delete message error:', err);
    alert('Failed to delete message');
  }
}

// Invoices List
let currentPage = 1;
async function loadInvoices(page = 1) {
  currentPage = page;
  const search = document.getElementById('search-input').value;
  
  try {
    const { invoices, total, pages } = await fetchAPI(`/invoices?page=${page}&search=${search}`);
    
    const listEl = document.getElementById('invoices-list');
    listEl.innerHTML = invoices.length ? 
      invoices.map(inv => createInvoiceItem(inv, true)).join('') :
      '<p style="text-align:center;color:var(--gray);padding:40px;">No invoices found</p>';
    
    // Pagination
    const pagEl = document.getElementById('pagination');
    if (pages > 1) {
      let pagHTML = '';
      for (let i = 1; i <= pages; i++) {
        pagHTML += `<button class="btn ${i === page ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="loadInvoices(${i})">${i}</button>`;
      }
      pagEl.innerHTML = pagHTML;
    } else {
      pagEl.innerHTML = '';
    }
  } catch (err) {
    console.error('Load invoices error:', err);
  }
}

function createInvoiceItem(inv, showActions = false) {
  const date = new Date(inv.date).toLocaleDateString();
  const statusClass = inv.paidStatus === 'paid' ? 'style="background:var(--success);color:white;"' :
                      inv.paidStatus === 'partial' ? 'style="background:var(--warning);color:white;"' :
                      'style="background:var(--gray-light);"';
  const statusText = inv.paidStatus === 'paid' ? 'Paid' : inv.paidStatus === 'partial' ? 'Partial' : 'Unpaid';

  return `
    <div class="invoice-item" onclick="editInvoice(${inv.id})">
      <div class="invoice-number">#${inv.invoiceNumber}</div>
      <div class="invoice-customer">
        <strong>${inv.customerName}</strong>
        <span>${date} ${inv.bayanNo ? '| Bayan: ' + inv.bayanNo : ''}</span>
      </div>
      <div class="invoice-amount">
        <strong>${inv.total.toFixed(3)} KWD</strong>
        <span>Balance: ${inv.balance.toFixed(3)}</span>
        <span class="badge" ${statusClass}>${statusText}</span>
      </div>
      ${showActions ? `
        <div class="invoice-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" onclick="previewInvoice(${inv.id})" title="Preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          ${inv.paidStatus !== 'paid' ? `
            <button class="btn-icon" onclick="markAsPaid(${inv.id})" title="Mark as Paid" style="color:var(--success);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </button>
          ` : ''}
          <button class="btn-icon" onclick="editInvoice(${inv.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon danger" onclick="deleteInvoice(${inv.id})" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

// Search
document.getElementById('search-input').addEventListener('input', debounce(() => loadInvoices(1), 300));

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Invoice Form
async function prepareNewInvoice() {
  currentInvoice = null;
  document.getElementById('invoice-id').value = '';
  document.getElementById('invoice-form').reset();
  document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('print-btn').style.display = 'none';
  document.getElementById('page-title').textContent = 'New Invoice';
  
  try {
    const { nextNumber } = await fetchAPI('/next-invoice-number');
    document.getElementById('invoice-number').value = nextNumber;
  } catch (err) {
    document.getElementById('invoice-number').value = 'Auto';
  }
  
  // Add default line items
  document.getElementById('line-items').innerHTML = '';
  addLineItem();
}

async function editInvoice(id) {
  try {
    const invoice = await fetchAPI(`/invoices/${id}`);
    currentInvoice = invoice;

    document.getElementById('invoice-id').value = invoice.id;
    document.getElementById('invoice-number').value = invoice.invoiceNumber;
    document.getElementById('invoice-date').value = invoice.date.split('T')[0];
    document.getElementById('customer-name').value = invoice.customerName;
    document.getElementById('bayan-no').value = invoice.bayanNo || '';
    document.getElementById('weight').value = invoice.weight || '';
    document.getElementById('bl-awb').value = invoice.blAwb || '';
    document.getElementById('quantity').value = invoice.quantity || '';
    document.getElementById('sea-air-land').value = invoice.seaAirLand || '';
    document.getElementById('description').value = invoice.description || '';
    document.getElementById('paid-amount').value = invoice.paid;
    document.getElementById('receiver-name').value = invoice.receiverName || '';
    document.getElementById('receiver-phone').value = invoice.receiverPhone || '';
    document.getElementById('notes').value = invoice.notes || '';
    document.getElementById('paid-status').value = invoice.paidStatus || 'unpaid';

    // Load line items
    const lineItemsEl = document.getElementById('line-items');
    lineItemsEl.innerHTML = '';
    console.log('Invoice items:', invoice.items);
    invoice.items.forEach((item, index) => {
      console.log(`Loading item ${index}:`, item);
      addLineItem(item.descriptionEn, item.descriptionAr, item.amount || 0, item.remarks || '');
    });

    // Small delay to ensure DOM is updated before calculating
    setTimeout(() => {
      const amountInputs = document.querySelectorAll('.item-amount');
      console.log('Amount inputs found:', amountInputs.length);
      amountInputs.forEach((input, i) => {
        console.log(`Input ${i} value:`, input.value);
      });
      calculateTotal();
    }, 50);
    document.getElementById('print-btn').style.display = 'inline-block';
    document.getElementById('page-title').textContent = `Invoice #${invoice.invoiceNumber}`;

    // Show create view without calling prepareNewInvoice (which resets the form)
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('create-view').classList.add('active');
    document.querySelector('[data-view="create"]')?.classList.add('active');
  } catch (err) {
    console.error('Edit invoice error:', err);
    alert('Failed to load invoice');
  }
}

function addLineItem(descEn = '', descAr = '', amount = '', remarks = '') {
  const lineItemsEl = document.getElementById('line-items');
  const div = document.createElement('div');
  div.className = 'line-item';
  div.innerHTML = `
    <input type="text" class="item-remarks" placeholder="Remarks" value="${remarks}">
    <div class="desc-group">
      <select class="item-template" onchange="applyTemplate(this)">
        <option value="">Select Service...</option>
        ${serviceTemplates.map(s => `<option value="${s.en}|${s.ar}" ${s.en === descEn ? 'selected' : ''}>${s.en}</option>`).join('')}
        <option value="custom">Custom...</option>
      </select>
      <input type="text" class="item-desc-en" placeholder="Description (EN)" value="${descEn}" style="${descEn && !serviceTemplates.find(s => s.en === descEn) ? '' : 'display:none'}">
      <input type="text" class="item-desc-ar" placeholder="Description (AR)" value="${descAr}" dir="rtl" style="${descEn && !serviceTemplates.find(s => s.en === descEn) ? '' : 'display:none'}">
    </div>
    <input type="number" class="item-amount" step="0.001" placeholder="0.000" value="${amount}" onchange="calculateTotal()">
    <button type="button" class="btn-remove" onclick="removeLineItem(this)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;
  lineItemsEl.appendChild(div);
  
  // Set template if matches
  if (descEn) {
    const template = serviceTemplates.find(s => s.en === descEn);
    if (template) {
      div.querySelector('.item-template').value = `${template.en}|${template.ar}`;
    } else {
      div.querySelector('.item-template').value = 'custom';
      div.querySelector('.item-desc-en').style.display = '';
      div.querySelector('.item-desc-ar').style.display = '';
    }
  }
}

function applyTemplate(select) {
  const lineItem = select.closest('.line-item');
  const descEn = lineItem.querySelector('.item-desc-en');
  const descAr = lineItem.querySelector('.item-desc-ar');
  
  if (select.value === 'custom') {
    descEn.style.display = '';
    descAr.style.display = '';
    descEn.value = '';
    descAr.value = '';
  } else if (select.value) {
    const [en, ar] = select.value.split('|');
    descEn.value = en;
    descAr.value = ar;
    descEn.style.display = 'none';
    descAr.style.display = 'none';
  }
}

function removeLineItem(btn) {
  btn.closest('.line-item').remove();
  calculateTotal();
}

function calculateTotal() {
  const amounts = document.querySelectorAll('.item-amount');
  let total = 0;
  amounts.forEach(input => {
    total += parseFloat(input.value) || 0;
  });
  document.getElementById('total-amount').textContent = total.toFixed(3) + ' KWD';
  calculateBalance();
}

function calculateBalance() {
  const totalText = document.getElementById('total-amount').textContent;
  const total = parseFloat(totalText) || 0;
  const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
  const balance = total - paid;
  document.getElementById('balance-amount').value = balance.toFixed(3) + ' KWD';

  // Auto-set paid status
  const statusSelect = document.getElementById('paid-status');
  if (balance <= 0 && total > 0) {
    statusSelect.value = 'paid';
  } else if (paid > 0) {
    statusSelect.value = 'partial';
  } else {
    statusSelect.value = 'unpaid';
  }
}

// Save Invoice
document.getElementById('invoice-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const lineItems = [];
  document.querySelectorAll('.line-item').forEach(item => {
    const template = item.querySelector('.item-template').value;
    let descEn, descAr;
    
    if (template && template !== 'custom') {
      [descEn, descAr] = template.split('|');
    } else {
      descEn = item.querySelector('.item-desc-en').value;
      descAr = item.querySelector('.item-desc-ar').value;
    }
    
    const amount = parseFloat(item.querySelector('.item-amount').value) || 0;
    const remarks = item.querySelector('.item-remarks').value;
    
    if (descEn || amount > 0) {
      lineItems.push({ descriptionEn: descEn, descriptionAr: descAr, amount, remarks });
    }
  });
  
  const invoiceData = {
    date: document.getElementById('invoice-date').value,
    customerName: document.getElementById('customer-name').value,
    bayanNo: document.getElementById('bayan-no').value,
    weight: document.getElementById('weight').value,
    blAwb: document.getElementById('bl-awb').value,
    quantity: document.getElementById('quantity').value,
    seaAirLand: document.getElementById('sea-air-land').value,
    description: document.getElementById('description').value,
    paid: parseFloat(document.getElementById('paid-amount').value) || 0,
    paidStatus: document.getElementById('paid-status').value,
    receiverName: document.getElementById('receiver-name').value,
    receiverPhone: document.getElementById('receiver-phone').value,
    notes: document.getElementById('notes').value,
    items: lineItems
  };
  
  try {
    const id = document.getElementById('invoice-id').value;
    const endpoint = id ? `/invoices/${id}` : '/invoices';
    const method = id ? 'PUT' : 'POST';
    
    const result = await fetchAPI(endpoint, {
      method,
      body: JSON.stringify(invoiceData)
    });
    
    currentInvoice = result;
    document.getElementById('invoice-id').value = result.id;
    document.getElementById('invoice-number').value = result.invoiceNumber;
    document.getElementById('print-btn').style.display = 'inline-block';
    document.getElementById('page-title').textContent = `Invoice #${result.invoiceNumber}`;
    
    alert('Invoice saved successfully!');
  } catch (err) {
    console.error('Save invoice error:', err);
    alert('Failed to save invoice');
  }
});

async function deleteInvoice(id) {
  if (!confirm('Are you sure you want to delete this invoice?')) return;

  try {
    await fetchAPI(`/invoices/${id}`, { method: 'DELETE' });
    loadInvoices(currentPage);
    loadDashboard();
  } catch (err) {
    console.error('Delete invoice error:', err);
    alert('Failed to delete invoice');
  }
}

async function markAsPaid(id) {
  try {
    const invoice = await fetchAPI(`/invoices/${id}`);
    await fetchAPI(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...invoice,
        paid: invoice.total,
        balance: 0,
        paidStatus: 'paid'
      })
    });
    loadInvoices(currentPage);
    loadDashboard();
  } catch (err) {
    console.error('Mark as paid error:', err);
    alert('Failed to update invoice');
  }
}

async function previewInvoice(id) {
  try {
    const invoice = await fetchAPI(`/invoices/${id}`);
    currentInvoice = invoice;
    printInvoice();
  } catch (err) {
    console.error('Preview invoice error:', err);
    alert('Failed to load invoice preview');
  }
}

function resetForm() {
  showView('invoices');
}

// Print Invoice
async function printInvoice() {
  if (!currentInvoice) return;

  const inv = currentInvoice;
  const date = new Date(inv.date).toLocaleDateString();

  // Fetch settings for logo and QR code
  let settings = { showQrCode: true };
  let qrCodeDataUrl = '';
  try {
    settings = await fetchAPI('/settings');
    if (settings.showQrCode !== false) {
      const qrResponse = await fetchAPI(`/qr/${inv.invoiceNumber}`);
      qrCodeDataUrl = qrResponse.qrCode;
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
  }

  const itemsHTML = inv.items.map(item => `
    <tr>
      <td class="remarks">${item.remarks || ''}</td>
      <td class="desc">
        <span class="desc-en">${item.descriptionEn}</span>
        <span class="desc-ar">${item.descriptionAr}</span>
      </td>
      <td class="amount">${item.amount > 0 ? item.amount.toFixed(3) : ''}</td>
      <td class="kd">${item.amount > 0 ? item.amount.toFixed(3) : ''}</td>
      <td class="fils">${item.amount > 0 ? Math.round(item.amount * 1000) : ''}</td>
    </tr>
  `).join('');

  // Logo HTML
  const logoHTML = settings.logoUrl ? `<img src="${settings.logoUrl}" class="company-logo" alt="Logo">` : '';
  const stampHTML = settings.stampUrl ? `<img src="${settings.stampUrl}" class="company-stamp" alt="Stamp">` : '';
  const qrCodeHTML = (settings.showQrCode !== false && qrCodeDataUrl) ? `<img src="${qrCodeDataUrl}" class="qr-code" alt="QR Code">` : '';

  const printHTML = `
    <div class="print-invoice">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&family=Arial:wght@400;700&display=swap');

        .print-invoice {
          font-family: Arial, sans-serif;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 8mm;
          background: white;
          box-sizing: border-box;
          border: 2px solid #000;
        }

        /* Header Section */
        .print-header {
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
          margin-bottom: 8px;
          position: relative;
        }

        .header-left {
          position: absolute;
          left: 10px;
          top: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .airplane-icon {
          display: none;
        }

        .company-logo {
          max-width: 150px;
          max-height: 100px;
        }

        .company-stamp {
          max-width: 90px;
          max-height: 90px;
          position: absolute;
          bottom: 10px;
          left: 10px;
          opacity: 0.8;
        }

        .qr-code {
          max-width: 80px;
          max-height: 80px;
          margin-top: 5px;
        }

        .print-header h1 {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 5px 0;
          color: #000;
        }

        .print-header .subtitle {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 12px;
          margin: 2px 0;
        }

        .print-header .en-subtitle {
          font-size: 9px;
          color: #444;
          margin: 2px 0;
        }

        .doc-type {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: underline;
          margin: 10px 0 5px 0;
        }

        .doc-type-en {
          font-size: 10px;
          font-weight: 700;
          text-decoration: underline;
        }

        .serial-box {
          position: absolute;
          right: 10px;
          top: 10px;
          text-align: center;
        }

        .serial-number {
          font-size: 24px;
          font-weight: 700;
          color: #D32F2F;
          line-height: 1;
        }

        .date-field {
          font-size: 10px;
          margin-top: 5px;
        }

        /* Customer Info Section */
        .customer-info {
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          margin: 3px 0;
        }

        .info-row.multi {
          display: flex;
          justify-content: space-between;
        }

        .info-col {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .dotted-line {
          border-bottom: 1px dotted #000;
          min-width: 50px;
          display: inline-block;
        }

        .ar-text {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
        }

        /* Table Section */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
        }

        .items-table th {
          background: #f5f5f5;
          border: 1px solid #000;
          padding: 5px 3px;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }

        .items-table td {
          border: 1px solid #000;
          padding: 4px 3px;
          font-size: 10px;
          vertical-align: top;
        }

        .items-table .remarks { width: 10%; text-align: center; }
        .items-table .desc { width: 48%; text-align: right; }
        .items-table .desc-en {
          text-align: left;
          display: block;
          font-size: 9px;
          color: #000;
        }
        .items-table .desc-ar {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
          display: block;
          font-size: 11px;
        }
        .items-table .amount { width: 12%; text-align: center; }
        .items-table .kd { width: 15%; text-align: center; }
        .items-table .fils { width: 15%; text-align: center; font-size: 9px; }

        .row-dotted {
          border-bottom: 1px dotted #000;
        }

        /* Summary Section */
        .summary-section {
          border-top: 2px solid #000;
          margin-top: 0;
          padding-top: 5px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 10px;
          font-size: 11px;
        }

        .summary-row.total {
          font-weight: 700;
          font-size: 12px;
        }

        .amount-in-words {
          margin-top: 15px;
          padding: 10px;
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 10px;
        }

        .words-en {
          display: block;
          margin-top: 3px;
          color: #000;
          text-transform: uppercase;
        }

        .words-ar {
          display: block;
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
          margin-top: 3px;
          color: #333;
        }

        /* Footer Section */
        .footer-box {
          background: #000;
          color: #fff;
          text-align: center;
          padding: 8px 5px;
          margin-top: 15px;
          border-radius: 3px;
        }

        .footer-box .ar {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          display: block;
          margin-bottom: 3px;
        }

        .footer-box .en {
          font-size: 9px;
        }

        /* Print Actions */
        .print-actions {
          text-align: center;
          margin-bottom: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }

        .print-actions button {
          padding: 10px 25px;
          margin: 0 10px;
          cursor: pointer;
          font-size: 14px;
          border: 1px solid #ccc;
          background: #fff;
          border-radius: 4px;
        }

        .print-actions button:hover {
          background: #e0e0e0;
        }

        @media print {
          .print-actions { display: none !important; }
          .print-invoice { border: none; margin: 0; padding: 5mm; }
          body { margin: 0; }
        }
      </style>

      <div class="print-actions">
        <button onclick="window.print()">Print</button>
        <button onclick="closePrintPreview()">Close</button>
      </div>

      <div class="print-header">
        <div class="header-left">
          <svg class="airplane-icon" viewBox="0 0 64 32" fill="#000">
            <path d="M60 16L48 8V14H16L8 6H4L8 16L4 26H8L16 18H48V24L60 16Z"/>
          </svg>
          ${logoHTML}
        </div>

        <div class="serial-box">
          <div class="serial-number">${inv.invoiceNumber}</div>
          ${qrCodeHTML}
          <div class="date-field">
            <span class="ar-text">التاريخ :</span> <span>Date :</span>
          </div>
        </div>

        <h1>${settings.companyNameAr || 'مكتب محرم راكان العجمي للتخليص الجمركي'}</h1>
        <p class="subtitle"><span class="ar-text">بإدارة :</span> ${settings.ownerNameAr || 'محمد حسن محمد عبد الحق'} : ${settings.phone || '60744492'}</p>
        <p class="subtitle"><span class="ar-text">تخليص جمركي – جوي – بحري – بري</span></p>
        <p class="en-subtitle">${settings.companyName || 'Customs Clearance'} - Air - Sea - Land</p>

        <div class="doc-type">
          <span class="ar-text">فاتورة نقداً / بالحساب</span>
        </div>
        <div class="doc-type-en">Cash / Credit Invoice</div>

        ${stampHTML}
      </div>

      <div class="customer-info">
        <div class="info-row">
          <span><span class="ar-text">المطلوب من السيد / السادة :</span></span>
          <span class="dotted-line" style="min-width: 150px;">${inv.customerName}</span>
          <span>Mr. / Mrs :</span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">عن بوليصة رقم :</span>
            <span class="dotted-line" style="min-width: 80px;">${inv.blAwb || ''}</span>
            <span>Bl/Awd</span>
          </span>
          <span class="info-col">
            <span class="ar-text">الوزن :</span>
            <span class="dotted-line" style="min-width: 50px;">${inv.weight || ''}</span>
            <span>Weight :</span>
          </span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">بحرا / جوا / برا :</span>
            <span class="dotted-line" style="min-width: 60px;">${inv.seaAirLand || ''}</span>
            <span>Sea/Air/Land</span>
          </span>
          <span class="info-col">
            <span class="ar-text">عدد الطرود :</span>
            <span class="dotted-line" style="min-width: 40px;">${inv.quantity || ''}</span>
            <span>Qty :</span>
          </span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">نوع البضاعة :</span>
            <span class="dotted-line" style="min-width: 80px;">${inv.description || ''}</span>
            <span>Description :</span>
          </span>
          <span class="info-col">
            <span class="ar-text">رقم البيان :</span>
            <span class="dotted-line" style="min-width: 60px;">${inv.bayanNo || ''}</span>
            <span>Bayan No. :</span>
          </span>
          <span class="info-col">
            <span class="ar-text">التاريخ :</span>
            <span class="dotted-line" style="min-width: 60px;">${date}</span>
            <span>Date :</span>
          </span>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Remarks<br><span class="ar-text">ملاحظات</span></th>
            <th>Description<br><span class="ar-text">التفاصيل</span></th>
            <th>Amount<br><span class="ar-text">المبلغ</span></th>
            <th>K.D.<br><span class="ar-text">دينار</span></th>
            <th>Fils<br><span class="ar-text">فلس</span></th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="summary-section">
        <div class="summary-row total">
          <span><span class="ar-text">المجموع :</span> Total</span>
          <span>${inv.total.toFixed(3)} KWD</span>
        </div>
        <div class="summary-row">
          <span><span class="ar-text">دفعات بالحساب وخصم :</span> Paids</span>
          <span>${inv.paid.toFixed(3)} KWD</span>
        </div>
        <div class="summary-row">
          <span><span class="ar-text">الباقي :</span> Balance</span>
          <span>${inv.balance.toFixed(3)} KWD</span>
        </div>
        <div class="amount-in-words">
          <span class="ar-text">المبلغ بالحروف :</span> Amount in Words:
          <span class="words-en">${numberToEnglish(inv.total)} KUWAITI DINARS ONLY</span>
          <span class="words-ar">${numberToArabic(inv.total)}</span>
        </div>
      </div>

      <div class="footer-box">
        <span class="ar">تصدر الشيكات باسم : ${settings.ownerNameAr || 'محمد حسن محمد عبد الحق'}</span>
        <span class="en">Issue Cheque in The Name of : ${settings.ownerName || 'Mohd. hassan Mohd. Abd. Haq'}</span>
      </div>
    </div>
  `;

  const previewEl = document.getElementById('print-preview');
  previewEl.innerHTML = printHTML;
  previewEl.classList.remove('hidden');
}

function closePrintPreview() {
  document.getElementById('print-preview').classList.add('hidden');
}

// Number to English words conversion
function numberToEnglish(amount) {
  const kd = Math.floor(amount);
  const fils = Math.round((amount - kd) * 1000);

  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertUnderThousand(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convertUnderThousand(n % 100) : '');
  }

  function convertNumber(n) {
    if (n === 0) return 'ZERO';
    let result = '';
    if (n >= 1000000) {
      result += convertUnderThousand(Math.floor(n / 1000000)) + ' MILLION';
      n %= 1000000;
      if (n > 0) result += ' ';
    }
    if (n >= 1000) {
      result += convertUnderThousand(Math.floor(n / 1000)) + ' THOUSAND';
      n %= 1000;
      if (n > 0) result += ' ';
    }
    result += convertUnderThousand(Math.floor(n));
    return result;
  }

  let words = convertNumber(kd);
  if (fils > 0) {
    words += ' AND ' + convertNumber(fils) + ' FILS';
  }
  return words;
}

// Number to Arabic words conversion
function numberToArabic(amount) {
  const kd = Math.floor(amount);
  const fils = Math.round((amount - kd) * 1000);

  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
    'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمعمائة', 'تسعمائة'];

  function convertUnderTwenty(n) {
    if (n === 0) return '';
    if (n < 20) return units[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' و' + units[n % 10] : '');
  }

  function convertUnderThousand(n) {
    if (n === 0) return '';
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' و' + units[n % 10] : '');
    return hundreds[Math.floor(n / 100)] + (n % 100 ? ' و' + convertUnderTwenty(n % 100) : '');
  }

  function convertNumber(n) {
    if (n === 0) return 'صفر';
    let result = '';
    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      result += convertNumber(millions) + ' مليون';
      n %= 1000000;
      if (n > 0) result += ' و';
    }
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      if (thousands === 1) {
        result += 'ألف';
      } else if (thousands === 2) {
        result += 'ألفان';
      } else if (thousands > 2 && thousands < 11) {
        result += convertNumber(thousands) + ' آلاف';
      } else {
        result += convertNumber(thousands) + ' ألف';
      }
      n %= 1000;
      if (n > 0) result += ' و';
    }
    result += convertUnderThousand(n);
    return result;
  }

  let words = 'فقط ' + convertNumber(kd) + ' دينار كويتي';
  if (fils > 0) {
    words += ' و' + convertNumber(fils) + ' فلس';
  }
  words += ' لا غير';
  return words;
}

// Settings
async function loadSettings() {
  try {
    const settings = await fetchAPI('/settings');

    document.getElementById('company-name').value = settings.companyName || '';
    document.getElementById('company-name-ar').value = settings.companyNameAr || '';
    document.getElementById('owner-name').value = settings.ownerName || '';
    document.getElementById('owner-name-ar').value = settings.ownerNameAr || '';
    document.getElementById('settings-phone').value = settings.phone || '';
    document.getElementById('last-invoice-number').value = settings.lastInvoiceNumber || 1000;
    document.getElementById('logo-url').value = settings.logoUrl || '';
    document.getElementById('stamp-url').value = settings.stampUrl || '';
    document.getElementById('show-qr-code').checked = settings.showQrCode !== false;
    document.getElementById('qr-base-url').value = settings.qrBaseUrl || `http://localhost:3000/verify`;

    // Show previews
    if (settings.logoUrl) {
      document.getElementById('logo-preview').innerHTML = `<img src="${settings.logoUrl}" alt="Logo">`;
    }
    if (settings.stampUrl) {
      document.getElementById('stamp-preview').innerHTML = `<img src="${settings.stampUrl}" alt="Stamp">`;
    }
  } catch (err) {
    console.error('Load settings error:', err);
  }
}

async function saveSettings(e) {
  e.preventDefault();

  const settingsData = {
    companyName: document.getElementById('company-name').value,
    companyNameAr: document.getElementById('company-name-ar').value,
    ownerName: document.getElementById('owner-name').value,
    ownerNameAr: document.getElementById('owner-name-ar').value,
    phone: document.getElementById('settings-phone').value,
    lastInvoiceNumber: parseInt(document.getElementById('last-invoice-number').value) || 1000,
    logoUrl: document.getElementById('logo-url').value,
    stampUrl: document.getElementById('stamp-url').value,
    showQrCode: document.getElementById('show-qr-code').checked,
    qrBaseUrl: document.getElementById('qr-base-url').value
  };

  try {
    await fetchAPI('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
    alert('Settings saved successfully!');
  } catch (err) {
    console.error('Save settings error:', err);
    alert('Failed to save settings');
  }
}

async function uploadFile(input, previewId) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();

    // Update hidden field
    const fieldName = input.id === 'logo-upload' ? 'logo-url' : 'stamp-url';
    document.getElementById(fieldName).value = data.url;

    // Show preview
    document.getElementById(previewId).innerHTML = `<img src="${data.url}" alt="Preview">`;

    alert('File uploaded successfully!');
  } catch (err) {
    console.error('Upload error:', err);
    alert('Failed to upload file');
  }
}

// Blank Invoice
async function printBlankInvoice() {
  // Fetch settings
  let settings = {};
  try {
    settings = await fetchAPI('/settings');
  } catch (err) {
    console.error('Error fetching settings:', err);
  }

  const printHTML = `
    <div class="print-invoice">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&family=Arial:wght@400;700&display=swap');

        .print-invoice {
          font-family: Arial, sans-serif;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 8mm;
          background: white;
          box-sizing: border-box;
          border: 2px solid #000;
        }

        .print-header {
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
          margin-bottom: 8px;
          position: relative;
        }

        .header-left {
          position: absolute;
          left: 10px;
          top: 5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .airplane-icon {
          width: 45px;
          height: auto;
        }

        .company-logo {
          max-width: 60px;
          max-height: 50px;
        }

        .company-stamp {
          max-width: 70px;
          max-height: 70px;
          position: absolute;
          bottom: 10px;
          left: 10px;
          opacity: 0.8;
        }

        .print-header h1 {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 5px 0;
        }

        .print-header .subtitle {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 12px;
          margin: 2px 0;
        }

        .print-header .en-subtitle {
          font-size: 9px;
          color: #444;
          margin: 2px 0;
        }

        .doc-type {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: underline;
          margin: 10px 0 5px 0;
        }

        .doc-type-en {
          font-size: 10px;
          font-weight: 700;
          text-decoration: underline;
        }

        .serial-box {
          position: absolute;
          right: 10px;
          top: 10px;
          text-align: center;
        }

        .serial-number {
          font-size: 24px;
          font-weight: 700;
          color: #D32F2F;
          line-height: 1;
        }

        .date-field {
          font-size: 10px;
          margin-top: 5px;
        }

        .customer-info {
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          margin: 3px 0;
        }

        .info-row.multi {
          display: flex;
          justify-content: space-between;
        }

        .info-col {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .dotted-line {
          border-bottom: 1px dotted #000;
          min-width: 50px;
          display: inline-block;
        }

        .ar-text {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
        }

        .items-table th {
          background: #f5f5f5;
          border: 1px solid #000;
          padding: 5px 3px;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }

        .items-table td {
          border: 1px solid #000;
          padding: 4px 3px;
          font-size: 10px;
          height: 30px;
        }

        .items-table .remarks { width: 12%; }
        .items-table .desc { width: 58%; }
        .items-table .amount { width: 15%; }
        .items-table .fils { width: 15%; }

        .summary-section {
          border-top: 2px solid #000;
          margin-top: 0;
          padding-top: 5px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 10px;
          font-size: 11px;
        }

        .summary-row.total {
          font-weight: 700;
          font-size: 12px;
        }

        .amount-in-words {
          margin-top: 15px;
          padding: 10px;
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 10px;
        }

        .words-en {
          display: block;
          margin-top: 3px;
          color: #000;
          text-transform: uppercase;
        }

        .words-ar {
          display: block;
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
          margin-top: 3px;
          color: #333;
        }

        .footer-box {
          background: #000;
          color: #fff;
          text-align: center;
          padding: 8px 5px;
          margin-top: 15px;
          border-radius: 3px;
        }

        .footer-box .ar {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          display: block;
          margin-bottom: 3px;
        }

        .footer-box .en {
          font-size: 9px;
        }

        .print-actions {
          text-align: center;
          margin-bottom: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }

        .print-actions button {
          padding: 10px 25px;
          margin: 0 10px;
          cursor: pointer;
          font-size: 14px;
          border: 1px solid #ccc;
          background: #fff;
          border-radius: 4px;
        }

        .print-actions button:hover {
          background: #e0e0e0;
        }

        @media print {
          .print-actions { display: none !important; }
          .print-invoice { border: none; margin: 0; padding: 5mm; }
          body { margin: 0; }
        }
      </style>

      <div class="print-actions">
        <button onclick="window.print()">Print</button>
        <button onclick="closePrintPreview()">Close</button>
      </div>

      <div class="print-header">
        <div class="header-left">
          <svg class="airplane-icon" viewBox="0 0 64 32" fill="#000">
            <path d="M60 16L48 8V14H16L8 6H4L8 16L4 26H8L16 18H48V24L60 16Z"/>
          </svg>
        </div>

        <div class="serial-box">
          <div class="serial-number">____</div>
          <div class="date-field">
            <span class="ar-text">التاريخ :</span> <span>Date :</span>
          </div>
        </div>

        <h1>${settings.companyNameAr || 'مكتب محرم راكان العجمي للتخليص الجمركي'}</h1>
        <p class="subtitle"><span class="ar-text">بإدارة :</span> ${settings.ownerNameAr || 'محمد حسن محمد عبد الحق'} : ${settings.phone || '60744492'}</p>
        <p class="subtitle"><span class="ar-text">تخليص جمركي – جوي – بحري –بري</span></p>
        <p class="en-subtitle">${settings.companyName || 'Customs Clearance'} - Air - Sea - Land</p>

        <div class="doc-type">
          <span class="ar-text">فاتورة نقداً / بالحساب</span>
        </div>
        <div class="doc-type-en">Cash / Credit Invoice</div>
      </div>

      <div class="customer-info">
        <div class="info-row">
          <span><span class="ar-text">المطلوب من السيد / السادة :</span></span>
          <span class="dotted-line" style="min-width: 150px;"></span>
          <span>Mr. / Mrs :</span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">عن بوليصة رقم :</span>
            <span class="dotted-line" style="min-width: 80px;"></span>
            <span>Bl/Awd</span>
          </span>
          <span class="info-col">
            <span class="ar-text">الوزن :</span>
            <span class="dotted-line" style="min-width: 50px;"></span>
            <span>Weight :</span>
          </span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">بحرا / جوا / برا :</span>
            <span class="dotted-line" style="min-width: 60px;"></span>
            <span>Sea/Air/Land</span>
          </span>
          <span class="info-col">
            <span class="ar-text">عدد الطرود :</span>
            <span class="dotted-line" style="min-width: 40px;"></span>
            <span>Qty :</span>
          </span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">نوع البضاعة :</span>
            <span class="dotted-line" style="min-width: 80px;"></span>
            <span>Description :</span>
          </span>
          <span class="info-col">
            <span class="ar-text">رقم البيان :</span>
            <span class="dotted-line" style="min-width: 60px;"></span>
            <span>Bayan No. :</span>
          </span>
          <span class="info-col">
            <span class="ar-text">التاريخ :</span>
            <span class="dotted-line" style="min-width: 60px;"></span>
            <span>Date :</span>
          </span>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Remarks<br><span class="ar-text">ملاحظات</span></th>
            <th>Description<br><span class="ar-text">التفاصيل</span></th>
            <th>K.D.<br><span class="ar-text">دينار</span></th>
            <th>Fils<br><span class="ar-text">فلس</span></th>
          </tr>
        </thead>
        <tbody>
          ${Array(15).fill('<tr><td class="remarks"></td><td class="desc"></td><td class="amount"></td><td class="fils"></td></tr>').join('')}
        </tbody>
      </table>

      <div class="summary-section">
        <div class="summary-row total">
          <span><span class="ar-text">المجموع :</span> Total</span>
          <span></span>
        </div>
        <div class="summary-row">
          <span><span class="ar-text">دفعات بالحساب وخصم :</span> Paids</span>
          <span></span>
        </div>
        <div class="summary-row">
          <span><span class="ar-text">الباقي :</span> Balance</span>
          <span></span>
        </div>
        <div class="amount-in-words">
          <span class="ar-text">المبلغ بالحروف :</span> Amount in Words:
          <span class="words-en">_____________________________</span>
          <span class="words-ar">_____________________________</span>
        </div>
      </div>

      <div class="footer-box">
        <span class="ar">تصدر الشيكات باسم : ${settings.ownerNameAr || 'محمد حسن محمد عبد الحق'}</span>
        <span class="en">Issue Cheque in The Name of : ${settings.ownerName || 'Mohd. hassan Mohd. Abd. Haq'}</span>
      </div>
    </div>
  `;

  const previewEl = document.getElementById('print-preview');
  previewEl.innerHTML = printHTML;
  previewEl.classList.remove('hidden');
}

// Settings form
document.getElementById('settings-form')?.addEventListener('submit', saveSettings);

// Preview Invoice from Settings
async function previewInvoiceFromSettings() {
  // Get current settings from form
  const settings = {
    companyName: document.getElementById('company-name').value || 'Muharram Rakan Al-Ajmi Customs Clearance Office',
    companyNameAr: document.getElementById('company-name-ar').value || 'مكتب محرم راكان العجمي للتخليص الجمركي',
    ownerName: document.getElementById('owner-name').value || 'Mohd. hassan Mohd. Abd. Haq',
    ownerNameAr: document.getElementById('owner-name-ar').value || 'محمد حسن محمد عبد الحق',
    phone: document.getElementById('settings-phone').value || '60744492',
    logoUrl: document.getElementById('logo-url').value || '',
    stampUrl: document.getElementById('stamp-url').value || '',
    showQrCode: document.getElementById('show-qr-code').checked
  };

  // Create sample invoice data for preview
  const sampleInvoice = {
    invoiceNumber: 'PREVIEW',
    date: new Date().toISOString(),
    customerName: 'Sample Customer',
    bayanNo: '12345',
    blAwb: 'BL2024001',
    weight: '1000 KG',
    quantity: '10 Pallets',
    seaAirLand: 'Sea',
    description: 'General Cargo',
    paid: 0,
    balance: 150.000,
    total: 150.000,
    items: [
      { descriptionEn: 'Customs Clearing Charges', descriptionAr: 'اجور تخليص', amount: 50.000, remarks: 'Service' },
      { descriptionEn: 'Freight Charges', descriptionAr: 'اجور شحن', amount: 75.000, remarks: 'Ocean Freight' },
      { descriptionEn: 'Handling Charges', descriptionAr: 'رسوم خدمات', amount: 25.000, remarks: 'Port Handling' }
    ]
  };

  // Generate QR code if enabled
  let qrCodeDataUrl = '';
  if (settings.showQrCode) {
    try {
      const qrResponse = await fetchAPI('/qr/PREVIEW');
      qrCodeDataUrl = qrResponse.qrCode;
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  }

  const date = new Date(sampleInvoice.date).toLocaleDateString();

  // Logo HTML
  const logoHTML = settings.logoUrl ? `<img src="${settings.logoUrl}" class="company-logo" alt="Logo">` : '';
  const stampHTML = settings.stampUrl ? `<img src="${settings.stampUrl}" class="company-stamp" alt="Stamp">` : '';
  const qrCodeHTML = (settings.showQrCode && qrCodeDataUrl) ? `<img src="${qrCodeDataUrl}" class="qr-code" alt="QR Code">` : '';

  const itemsHTML = sampleInvoice.items.map(item => `
    <tr>
      <td class="remarks">${item.remarks || ''}</td>
      <td class="desc">
        <span class="desc-en">${item.descriptionEn}</span>
        <span class="desc-ar">${item.descriptionAr}</span>
      </td>
      <td class="amount">${item.amount > 0 ? item.amount.toFixed(3) : ''}</td>
      <td class="fils">${item.amount > 0 ? Math.round(item.amount * 1000) : ''}</td>
    </tr>
  `).join('');

  const printHTML = `
    <div class="print-invoice">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&family=Arial:wght@400;700&display=swap');

        .print-invoice {
          font-family: Arial, sans-serif;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 8mm;
          background: white;
          box-sizing: border-box 2px solid #000;
       ;
          border: }

        /* Header Section */
        .print-header {
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
          margin-bottom: 8px;
          position: relative;
        }

        .header-left {
          position: absolute;
          left: 10px;
          top: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .airplane-icon {
          display: none;
        }

        .company-logo {
          max-width: 150px;
          max-height: 100px;
        }

        .company-stamp {
          max-width: 90px;
          max-height: 90px;
          position: absolute;
          bottom: 10px;
          left: 10px;
          opacity: 0.8;
        }

        .qr-code {
          max-width: 80px;
          max-height: 80px;
          margin-top: 5px;
        }

        .print-header h1 {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 5px 0;
          color: #000;
        }

        .print-header .subtitle {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 12px;
          margin: 2px 0;
        }

        .print-header .en-subtitle {
          font-size: 9px;
          color: #444;
          margin: 2px 0;
        }

        .doc-type {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-decoration: underline;
          margin: 10px 0 5px 0;
        }

        .doc-type-en {
          font-size: 10px;
          font-weight: 700;
          text-decoration: underline;
        }

        .serial-box {
          position: absolute;
          right: 10px;
          top: 10px;
          text-align: center;
        }

        .serial-number {
          font-size: 24px;
          font-weight: 700;
          color: #D32F2F;
          line-height: 1;
        }

        .date-field {
          font-size: 10px;
          margin-top: 5px;
        }

        /* Customer Info Section */
        .customer-info {
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          margin: 3px 0;
        }

        .info-row.multi {
          display: flex;
          justify-content: space-between;
        }

        .info-col {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .dotted-line {
          border-bottom: 1px dotted #000;
          min-width: 50px;
          display: inline-block;
        }

        .ar-text {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
        }

        /* Table Section */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
        }

        .items-table th {
          background: #f5f5f5;
          border: 1px solid #000;
          padding: 5px 3px;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }

        .items-table td {
          border: 1px solid #000;
          padding: 4px 3px;
          font-size: 10px;
          vertical-align: top;
        }

        .items-table .remarks { width: 10%; text-align: center; }
        .items-table .desc { width: 48%; text-align: right; }
        .items-table .desc-en {
          text-align: left;
          display: block;
          font-size: 9px;
          color: #000;
        }
        .items-table .desc-ar {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
          display: block;
          font-size: 11px;
        }
        .items-table .amount { width: 12%; text-align: center; }
        .items-table .kd { width: 15%; text-align: center; }
        .items-table .fils { width: 15%; text-align: center; font-size: 9px; }

        .row-dotted {
          border-bottom: 1px dotted #000;
        }

        /* Summary Section */
        .summary-section {
          border-top: 2px solid #000;
          margin-top: 0;
          padding-top: 5px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 10px;
          font-size: 11px;
        }

        .summary-row.total {
          font-weight: 700;
          font-size: 12px;
        }

        .amount-in-words {
          margin-top: 15px;
          padding: 10px;
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 10px;
        }

        .words-en {
          display: block;
          margin-top: 3px;
          color: #000;
          text-transform: uppercase;
        }

        .words-ar {
          display: block;
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          direction: rtl;
          margin-top: 3px;
          color: #333;
        }

        /* Footer Section */
        .footer-box {
          background: #000;
          color: #fff;
          text-align: center;
          padding: 8px 5px;
          margin-top: 15px;
          border-radius: 3px;
        }

        .footer-box .ar {
          font-family: 'Noto Kufi Arabic', Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          display: block;
          margin-bottom: 3px;
        }

        .footer-box .en {
          font-size: 9px;
        }

        /* Print Actions */
        .print-actions {
          text-align: center;
          margin-bottom: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }

        .print-actions button {
          padding: 10px 25px;
          margin: 0 10px;
          cursor: pointer;
          font-size: 14px;
          border: 1px solid #ccc;
          background: #fff;
          border-radius: 4px;
        }

        .print-actions button:hover {
          background: #e0e0e0;
        }

        @media print {
          .print-actions { display: none !important; }
          .print-invoice { border: none; margin: 0; padding: 5mm; }
          body { margin: 0; }
        }
      </style>

      <div class="print-actions">
        <button onclick="window.print()">Print</button>
        <button onclick="closePrintPreview()">Close</button>
      </div>

      <div class="print-header">
        <div class="header-left">
          ${logoHTML}
        </div>

        <div class="serial-box">
          <div class="serial-number">${sampleInvoice.invoiceNumber}</div>
          ${qrCodeHTML}
          <div class="date-field">
            <span class="ar-text">التاريخ :</span> <span>Date :</span>
          </div>
        </div>

        <h1>${settings.companyNameAr}</h1>
        <p class="subtitle"><span class="ar-text">بإدارة :</span> ${settings.ownerNameAr} : ${settings.phone}</p>
        <p class="subtitle"><span class="ar-text">تخليص جمركي – جوي – بحري – بري</span></p>
        <p class="en-subtitle">${settings.companyName} - Air - Sea - Land</p>

        <div class="doc-type">
          <span class="ar-text">فاتورة نقداً / بالحساب</span>
        </div>
        <div class="doc-type-en">Cash / Credit Invoice</div>

        ${stampHTML}
      </div>

      <div class="customer-info">
        <div class="info-row">
          <span><span class="ar-text">المطلوب من السيد / السادة :</span></span>
          <span class="dotted-line" style="min-width: 150px;">${sampleInvoice.customerName}</span>
          <span>Mr. / Mrs :</span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">عن بوليصة رقم :</span>
            <span class="dotted-line" style="min-width: 80px;">${sampleInvoice.blAwb}</span>
            <span>Bl/Awd</span>
          </span>
          <span class="info-col">
            <span class="ar-text">الوزن :</span>
            <span class="dotted-line" style="min-width: 50px;">${sampleInvoice.weight}</span>
            <span>Weight :</span>
          </span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">بحرا / جوا / برا :</span>
            <span class="dotted-line" style="min-width: 60px;">${sampleInvoice.seaAirLand}</span>
            <span>Sea/Air/Land</span>
          </span>
          <span class="info-col">
            <span class="ar-text">عدد الطرود :</span>
            <span class="dotted-line" style="min-width: 40px;">${sampleInvoice.quantity}</span>
            <span>Qty :</span>
          </span>
        </div>
        <div class="info-row multi">
          <span class="info-col">
            <span class="ar-text">نوع البضاعة :</span>
            <span class="dotted-line" style="min-width: 80px;">${sampleInvoice.description}</span>
            <span>Description :</span>
          </span>
          <span class="info-col">
            <span class="ar-text">رقم البيان :</span>
            <span class="dotted-line" style="min-width: 60px;">${sampleInvoice.bayanNo}</span>
            <span>Bayan No. :</span>
          </span>
          <span class="info-col">
            <span class="ar-text">التاريخ :</span>
            <span class="dotted-line" style="min-width: 60px;">${date}</span>
            <span>Date :</span>
          </span>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Remarks<br><span class="ar-text">ملاحظات</span></th>
            <th>Description<br><span class="ar-text">التفاصيل</span></th>
            <th>Amount<br><span class="ar-text">المبلغ</span></th>
            <th>K.D.<br><span class="ar-text">دينار</span></th>
            <th>Fils<br><span class="ar-text">فلس</span></th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="summary-section">
        <div class="summary-row total">
          <span><span class="ar-text">المجموع :</span> Total</span>
          <span>${sampleInvoice.total.toFixed(3)} KWD</span>
        </div>
        <div class="summary-row">
          <span><span class="ar-text">دفعات بالحساب وخصم :</span> Paids</span>
          <span>${sampleInvoice.paid.toFixed(3)} KWD</span>
        </div>
        <div class="summary-row">
          <span><span class="ar-text">الباقي :</span> Balance</span>
          <span>${sampleInvoice.balance.toFixed(3)} KWD</span>
        </div>
      </div>

      <div class="footer-box">
        <span class="ar">تصدر الشيكات باسم : ${settings.ownerNameAr}</span>
        <span class="en">Issue Cheque in The Name of : ${settings.ownerName}</span>
      </div>
    </div>
  `;

  const previewEl = document.getElementById('print-preview');
  previewEl.innerHTML = printHTML;
  previewEl.classList.remove('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (getToken()) {
    fetchAPI('/me').then(user => {
      document.getElementById('user-name').textContent = user.name;
      showAdmin();
    }).catch(() => showLogin());
  } else {
    showLogin();
  }
});
