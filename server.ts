import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  // Ensure persistent data directory
  const DATA_DIR = path.resolve(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const DB_FILE = path.join(DATA_DIR, 'maktab_database.json');
  const BACKUP_DB_FILE = path.join(DATA_DIR, 'maktab_backup_last_good.json');
  const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

  // Helper to read JSON file safely
  const readJSON = (filePath: string, fallback: any = null) => {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
    return fallback;
  };

  // Helper to write JSON file safely with directory ensure and permission safeguards
  const writeJSON = (filePath: string, data: any) => {
    try {
      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true, mode: 0o777 });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o666 });
      try {
        fs.chmodSync(filePath, 0o666);
      } catch {}
      return true;
    } catch (e) {
      console.error(`Error writing ${filePath}:`, e);
      return false;
    }
  };

  // 1. Get current maktab data (with fallback to last known good backup if DB is empty)
  app.get('/api/data', (req, res) => {
    let data = readJSON(DB_FILE, null);
    const hasData =
      data &&
      typeof data === 'object' &&
      ((Array.isArray(data.branches) && data.branches.length > 0) ||
       (Array.isArray(data.students) && data.students.length > 0) ||
       (Array.isArray(data.feePayments) && data.feePayments.length > 0) ||
       (Array.isArray(data.expenses) && data.expenses.length > 0));

    if (!hasData) {
      const backupData = readJSON(BACKUP_DB_FILE, null);
      if (
        backupData &&
        typeof backupData === 'object' &&
        ((Array.isArray(backupData.branches) && backupData.branches.length > 0) ||
         (Array.isArray(backupData.students) && backupData.students.length > 0))
      ) {
        data = backupData;
      } else {
        // Fallback: check any user backup file
        try {
          const files = fs.readdirSync(DATA_DIR);
          for (const file of files) {
            if (file.startsWith('user_') && file.endsWith('.json')) {
              const u = readJSON(path.join(DATA_DIR, file), null);
              const p = u?.payload || u;
              if (p && ((p.branches?.length > 0) || (p.students?.length > 0))) {
                data = p;
                break;
              }
            }
          }
        } catch {}
      }
    }

    res.json({ success: true, data });
  });

  // 2. Sync / Save maktab data to cloud server
  app.post('/api/sync', (req, res) => {
    try {
      const { payload, account } = req.body;
      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      const toSave = {
        ...payload,
        lastUpdated: new Date().toISOString(),
        updatedBy: account?.identifier || 'system',
      };

      writeJSON(DB_FILE, toSave);

      // If payload has actual user records, mirror to permanent snapshot backup
      const recordCount =
        (payload.branches?.length || 0) +
        (payload.students?.length || 0) +
        (payload.feePayments?.length || 0) +
        (payload.expenses?.length || 0) +
        (payload.deposits?.length || 0);

      if (recordCount > 0) {
        writeJSON(BACKUP_DB_FILE, toSave);
      }

      // Also store user-specific backup if account identifier provided
      if (account?.identifier) {
        const key = account.identifier.trim().toLowerCase();
        const userBackupFile = path.join(
          DATA_DIR,
          `user_${key.replace(/[^a-zA-Z0-9]/g, '_')}.json`
        );
        writeJSON(userBackupFile, {
          payload,
          account,
          lastUpdated: new Date().toISOString(),
        });

        // Also save directly into ACCOUNTS_FILE for redundancy
        const accounts = readJSON(ACCOUNTS_FILE, {}) || {};
        if (accounts[key]) {
          accounts[key].backup = payload;
          accounts[key].lastUpdated = new Date().toISOString();
          writeJSON(ACCOUNTS_FILE, accounts);
        }
      }

      return res.json({ success: true, timestamp: Date.now() });
    } catch (e: any) {
      console.error('Sync error:', e);
      return res.status(500).json({ error: 'Failed to sync data to server' });
    }
  });

  // 3. User Account / Cloud Login & Restore
  app.post('/api/account/login', (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and PIN/Password required' });
      }

      const accounts = readJSON(ACCOUNTS_FILE, {}) || {};
      const key = identifier.trim().toLowerCase();

      // If user exists, check password
      if (accounts[key]) {
        if (accounts[key].password !== password) {
          return res.status(401).json({ error: 'ভুল পিন বা পাসওয়ার্ড!' });
        }
      } else {
        // Register new account automatically
        accounts[key] = {
          identifier: key,
          password,
          createdAt: new Date().toISOString(),
        };
        writeJSON(ACCOUNTS_FILE, accounts);
      }

      // Check if user has backup file
      const userBackupFile = path.join(
        DATA_DIR,
        `user_${key.replace(/[^a-zA-Z0-9]/g, '_')}.json`
      );
      let userPayload = null;
      if (fs.existsSync(userBackupFile)) {
        const raw = readJSON(userBackupFile, null);
        userPayload = raw?.payload || raw;
      }
      if (!userPayload && accounts[key]?.backup) {
        userPayload = accounts[key].backup;
      }
      if (!userPayload && fs.existsSync(DB_FILE)) {
        const rawDb = readJSON(DB_FILE, null);
        userPayload = rawDb?.payload || rawDb;
      }

      return res.json({
        success: true,
        account: {
          identifier: key,
          name: accounts[key]?.name || key,
        },
        backup: userPayload,
      });
    } catch (e) {
      return res.status(500).json({ error: 'Account operation failed' });
    }
  });

  // 4. Download JSON backup
  app.get('/api/export-backup', (req, res) => {
    const data = readJSON(DB_FILE, {});
    res.setHeader('Content-disposition', 'attachment; filename=deeniyat_maktab_backup.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  });

  // 4.1 Download HTML file
  app.get('/api/download-html', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(htmlPath)) {
      res.setHeader('Content-disposition', 'attachment; filename=deeniyat_maktab_satkhira.html');
      res.setHeader('Content-type', 'text/html; charset=utf-8');
      return res.sendFile(htmlPath);
    }
    return res.status(404).send('HTML file not found');
  });

  // Helper to add files to JSZip recursively
  const addDirectoryToZip = (zip: JSZip, localDir: string, zipPrefix: string = '') => {
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(localDir, entry.name);
      const zipPath = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;

      // Skip ignored and generated directories/files
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git' ||
        entry.name === '.aistudio' ||
        entry.name === 'data' ||
        entry.name === '.env' ||
        entry.name.endsWith('.log')
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        addDirectoryToZip(zip, fullPath, zipPath);
      } else {
        try {
          const fileContent = fs.readFileSync(fullPath);
          zip.file(zipPath, fileContent);
        } catch (err) {
          console.warn(`Could not read file ${fullPath} for zip:`, err);
        }
      }
    }
  };

  // 5. Download complete Source Code as ZIP
  app.get('/api/download-source-zip', async (req, res) => {
    try {
      const zip = new JSZip();
      addDirectoryToZip(zip, __dirname);

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="deeniyat-maktab-satkhira-source-code.zip"'
      );
      res.setHeader('Content-Length', zipBuffer.length);
      res.send(zipBuffer);
    } catch (err) {
      console.error('Failed to create source zip:', err);
      res.status(500).json({ error: 'Failed to generate ZIP archive' });
    }
  });

  // 6. Reset all maktab database data (wipe all entries)
  app.post('/api/reset-data', (req, res) => {
    try {
      const emptyState = {
        branches: [],
        students: [],
        books: [
          {
            id: 'book-1',
            name: 'দ্বীনিয়াত মক্তব কোর্স প্রথম বর্ষ',
            stock: 25,
            buyPrice: 85,
            sellPrice: 100,
            classLevel: 'মক্তব ১ম বর্ষ',
          },
          {
            id: 'book-2',
            name: 'দ্বীনিয়াত মক্তব কোর্স দ্বিতীয় বর্ষ',
            stock: 20,
            buyPrice: 105,
            sellPrice: 125,
            classLevel: 'মক্তব ২য় বর্ষ',
          },
          {
            id: 'book-3',
            name: 'দ্বীনিয়াত মক্তব কোর্স তৃতীয় বর্ষ',
            stock: 15,
            buyPrice: 130,
            sellPrice: 150,
            classLevel: 'মক্তব ৩য় বর্ষ',
          },
          {
            id: 'book-4',
            name: 'দ্বীনিয়াত নূরানী কায়দা',
            stock: 50,
            buyPrice: 40,
            sellPrice: 50,
            classLevel: 'কায়দা বিভাগ',
          },
          {
            id: 'book-5',
            name: 'আমপারা শরীফ (দ্বীনিয়াত সংস্করণ)',
            stock: 30,
            buyPrice: 50,
            sellPrice: 65,
            classLevel: 'আমপারা বিভাগ',
          },
          {
            id: 'book-6',
            name: 'কুরআনুল কারীম (দ্বীনিয়াত নাযেরা)',
            stock: 20,
            buyPrice: 260,
            sellPrice: 300,
            classLevel: 'নাযেরা বিভাগ',
          },
          {
            id: 'book-7',
            name: "দ্বীনিয়াত দু'আ ও মাসায়েল শিক্ষা",
            stock: 35,
            buyPrice: 40,
            sellPrice: 55,
            classLevel: 'সকল শ্রেণী',
          },
          {
            id: 'book-8',
            name: 'দ্বীনিয়াত তাজবীদ শিক্ষা',
            stock: 25,
            buyPrice: 45,
            sellPrice: 60,
            classLevel: 'সকল শ্রেণী',
          },
          {
            id: 'book-9',
            name: 'দ্বীনিয়াত আকাঈদ ও মাসায়েল',
            stock: 20,
            buyPrice: 55,
            sellPrice: 70,
            classLevel: 'সকল শ্রেণী',
          },
          {
            id: 'book-10',
            name: 'দ্বীনিয়াত সীরাতুন্নবী (সা.)',
            stock: 18,
            buyPrice: 60,
            sellPrice: 80,
            classLevel: 'সকল শ্রেণী',
          },
        ],
        bookSales: [],
        feePayments: [],
        expenses: [],
        deposits: [],
        otherIncomes: [],
        teacherWithdrawals: [],
        attendanceRecords: [],
        account: {
          identifier: '',
          isLoggedIn: false,
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: 'user_reset',
      };

      writeJSON(DB_FILE, emptyState);

      // Clean up user backup files as well
      const userFiles = fs.readdirSync(DATA_DIR);
      for (const f of userFiles) {
        if (f.startsWith('user_') && f.endsWith('.json')) {
          try {
            fs.unlinkSync(path.join(DATA_DIR, f));
          } catch {}
        }
      }

      res.json({ success: true, message: 'All entries deleted successfully.' });
    } catch (err: any) {
      console.error('Reset error:', err);
      res.status(500).json({ error: 'Failed to reset database' });
    }
  });

  // Vite middleware in dev or static serve in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Deeniyat Maktab Server running on port ${PORT}`);
  });
}

startServer();
