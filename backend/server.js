const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kuwait-customs-secret-key-2024';

// Initialize database on startup
async function initializeDatabase() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Create default admin user if not exists
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          name: 'Administrator'
        }
      });
      console.log('Default admin user created');
    }

    // Create default settings if not exists
    const settingsExist = await prisma.settings.findFirst();
    if (!settingsExist) {
      await prisma.settings.create({
        data: {
          companyName: 'Muharram Rakan Al-Ajmi Customs Clearance Office',
          companyNameAr: 'مكتب محرم راكان العجمي للتخليص الجمركي',
          ownerName: 'Mohd. hassan Mohd. Abd. Haq',
          ownerNameAr: 'محمد حسن محمد عبدالحق',
          phone: '60744492',
          lastInvoiceNumber: 1000,
          qrBaseUrl: `http://localhost:${PORT}/verify`
        }
      });
      console.log('Default settings created');
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
    // Don't exit, continue anyway - SQLite might need db push
  }
}

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ id: user.id, username: user.username, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          companyName: 'Muharram Rakan Al-Ajmi Customs Clearance Office',
          companyNameAr: 'مكتب محرم راكان العجمي للتخليص الجمركي',
          ownerName: 'Mohd. hassan Mohd. Abd. Haq',
          ownerNameAr: 'محمد حسن محمد عبدالحق',
          phone: '60744492',
          lastInvoiceNumber: 1000,
          qrBaseUrl: `http://localhost:${PORT}/verify`
        }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const updated = await prisma.settings.update({
      where: { id: settings.id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload for logo/stamp
const multer = require('multer');
const fs = require('fs');
const uploadDir = path.join(__dirname, '../frontend/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename
  });
});

// QR Code generation
const QRCode = require('qrcode');

app.get('/api/qr/:invoiceNumber', async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    const baseUrl = settings?.qrBaseUrl || `http://localhost:${PORT}/verify`;
    const verifyUrl = `${baseUrl}/${req.params.invoiceNumber}`;

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 150,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.json({ qrCode: qrDataUrl, verifyUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invoice verification page
app.get('/verify/:invoiceNumber', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: req.params.invoiceNumber },
      include: { items: true }
    });

    const settings = await prisma.settings.findFirst();

    if (!invoice) {
      return res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>Invoice Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; max-width: 500px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #D32F2F; }
            .error { color: #666; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Invoice Not Found</h1>
            <p class="error">Invoice #${req.params.invoiceNumber} was not found in our system.</p>
          </div>
        </body>
        </html>
      `);
    }

    const totalFils = Math.round(invoice.total * 1000);
    const paidFils = Math.round(invoice.paid * 1000);
    const balanceFils = Math.round(invoice.balance * 1000);

    res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>Invoice Verified - #${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { font-family: 'Noto Kufi Arabic', Arial, margin: 0; }
          .verified-badge { background: #4CAF50; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-item { padding: 10px; background: #f9f9f9; border-radius: 5px; }
          .label { font-weight: bold; color: #666; display: block; font-size: 12px; }
          .value { font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #f5f5f5; }
          .total-row { background: #f5f5f5; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #000; }
          .qr-section { text-align: center; margin: 20px 0; }
          .qr-section img { max-width: 150px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="text-align: center;">
            <span class="verified-badge">Verified Invoice</span>
          </div>

          <div class="header">
            <h1>${settings?.companyNameAr || 'مكتب محرم راكان العجمي للتخليص الجمركي'}</h1>
            <p>${settings?.ownerNameAr || 'محمد حسن محمد عبدالحق'}</p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">Invoice Number</span>
              <span class="value">#${invoice.invoiceNumber}</span>
            </div>
            <div class="info-item">
              <span class="label">Date</span>
              <span class="value">${new Date(invoice.date).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="label">Customer</span>
              <span class="value">${invoice.customerName}</span>
            </div>
            <div class="info-item">
              <span class="label">Bayan No.</span>
              <span class="value">${invoice.bayanNo || '-'}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount (KWD)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.descriptionEn} / ${item.descriptionAr}</td>
                  <td>${item.amount.toFixed(3)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-row" style="padding: 15px; text-align: left;">
            <strong>Total: ${invoice.total.toFixed(3)} KWD</strong>
          </div>

          <div class="qr-section">
            <p>This invoice is verified and authentic</p>
          </div>

          <div class="footer">
            <p>${settings?.companyName || 'Muharram Rakan Al-Ajmi Customs Clearance Office'}</p>
            <p>${settings?.phone || '60744492'}</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invoice Routes
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { bayanNo: { contains: search } }
      ]
    } : {};
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.invoice.count({ where })
    ]);
    
    res.json({ invoices, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: { orderBy: { sortOrder: 'asc' } } }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/next-invoice-number', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    res.json({ nextNumber: (settings?.lastInvoiceNumber || 1000) + 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;

    // Get and update invoice number
    const settings = await prisma.settings.findFirst();
    const newNumber = (settings?.lastInvoiceNumber || 1000) + 1;

    await prisma.settings.update({
      where: { id: settings.id },
      data: { lastInvoiceNumber: newNumber }
    });

    // Calculate totals
    const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const paid = parseFloat(invoiceData.paid) || 0;
    const balance = total - paid;

    // Calculate paidStatus if not provided
    let paidStatus = invoiceData.paidStatus;
    if (!paidStatus) {
      if (balance <= 0 && total > 0) {
        paidStatus = 'paid';
      } else if (paid > 0) {
        paidStatus = 'partial';
      } else {
        paidStatus = 'unpaid';
      }
    }

    // Convert date string to DateTime
    const date = invoiceData.date ? new Date(invoiceData.date) : new Date();

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        date: date,
        invoiceNumber: newNumber.toString(),
        total,
        paid,
        balance,
        paidStatus,
        items: {
          create: items.map((item, index) => ({
            descriptionEn: item.descriptionEn,
            descriptionAr: item.descriptionAr,
            amount: parseFloat(item.amount) || 0,
            remarks: item.remarks || '',
            sortOrder: index
          }))
        }
      },
      include: { items: true }
    });

    res.json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;
    const id = parseInt(req.params.id);

    // Calculate totals
    const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const paid = parseFloat(invoiceData.paid) || 0;
    const balance = total - paid;

    // Calculate paidStatus if not provided
    let paidStatus = invoiceData.paidStatus;
    if (!paidStatus) {
      if (balance <= 0 && total > 0) {
        paidStatus = 'paid';
      } else if (paid > 0) {
        paidStatus = 'partial';
      } else {
        paidStatus = 'unpaid';
      }
    }

    // Convert date string to DateTime
    const date = invoiceData.date ? new Date(invoiceData.date) : undefined;

    // Delete existing items and recreate
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
        date: date,
        total,
        paid,
        balance,
        paidStatus,
        items: {
          create: items.map((item, index) => ({
            descriptionEn: item.descriptionEn,
            descriptionAr: item.descriptionAr,
            amount: parseFloat(item.amount) || 0,
            remarks: item.remarks || '',
            sortOrder: index
          }))
        }
      },
      include: { items: true }
    });

    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contact Messages Routes
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }

    // Use sqlite3 directly since Prisma might have issues
    const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'));
    db.run(`INSERT INTO ContactMessage (name, email, phone, message, status) VALUES (?, ?, ?, ?, 'new')`,
      [name, email, phone || '', message],
      function(err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contact', authenticateToken, async (req, res) => {
  try {
    const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'));
    db.all(`SELECT * FROM ContactMessage ORDER BY createdAt DESC`, [], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/contact/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'));
    db.run(`UPDATE ContactMessage SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, req.params.id],
      function(err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contact/:id', authenticateToken, async (req, res) => {
  try {
    const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'));
    db.run(`DELETE FROM ContactMessage WHERE id = ?`, [req.params.id], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Website Content Routes
app.get('/api/website-content', async (req, res) => {
  try {
    const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'));
    db.all(`SELECT section, key, value, sortOrder FROM WebsiteContent`, [], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });

      // Convert to object format
      const content = {};
      rows.forEach(row => {
        if (!content[row.section]) content[row.section] = {};
        content[row.section][row.key] = row.value;
      });
      res.json(content);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/website-content', authenticateToken, async (req, res) => {
  try {
    const { section, key, value, sortOrder } = req.body;

    const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'));
    db.run(`INSERT OR REPLACE INTO WebsiteContent (section, key, value, sortOrder) VALUES (?, ?, ?, ?)`,
      [section, key, value, sortOrder || 0],
      function(err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend (exclude API and verify routes)
app.get(/^(?!\/api\/|\/verify\/).+/, (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
