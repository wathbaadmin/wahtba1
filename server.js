const express = require('express');
const cors = require('cors');
const getMasterDb = require('./db/master');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;

// --- PORTAL APIs ---

app.get('/api/portal/check-domain', async (req, res) => {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const reserved = ['admin', 'login', 'portal', 'dashboard', 'api', 'settings', 'support', 'system', 'app', 'www', 'main', 'superadmin'];
    if (reserved.includes(domain)) {
        return res.json({ available: false, reason: 'reserved' });
    }

    try {
        const db = await getMasterDb;
        const tenant = await db.get('SELECT id FROM tenants WHERE domain = ?', [domain]);
        const request = await db.get('SELECT id FROM registration_requests WHERE domain = ? AND status != ?', [domain, 'rejected']);

        if (tenant || request) {
            return res.json({ available: false, reason: 'taken' });
        }

        res.json({ available: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/portal/register', async (req, res) => {
    const data = req.body;
    
    try {
        const db = await getMasterDb;
        await db.run(`
            INSERT INTO registration_requests (
                id, org_name, org_type, region, city, description, 
                expected_groups, expected_students, expected_teachers,
                manager_name, phone, email, username, password,
                site_name, logo_url, color_primary, color_secondary, domain
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `, [
            data.id, data.orgName, data.orgType, data.region, data.city, data.description,
            data.expectedGroups, data.expectedStudents, data.expectedTeachers,
            data.managerName, data.phone, data.email, data.username, data.password,
            data.siteName, data.logoUrl, data.colorPrimary, data.colorSecondary, data.domain
        ]);

        res.status(201).json({ success: true, message: 'Request submitted successfully', id: data.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

app.post('/api/portal/track', async (req, res) => {
    const { reqId, phone } = req.body;
    
    if (!reqId || !phone) return res.status(400).json({ error: 'Missing reqId or phone' });

    try {
        const db = await getMasterDb;
        const request = await db.get('SELECT * FROM registration_requests WHERE id = ? AND phone = ?', [reqId, phone]);
        
        if (request) {
            res.json({ success: true, request });
        } else {
            res.status(404).json({ error: 'Request not found' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/superadmin/requests', async (req, res) => {
    try {
        const db = await getMasterDb;
        const requests = await db.all('SELECT * FROM registration_requests ORDER BY created_at DESC');
        res.json(requests);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Sanad Backend Server is running on http://localhost:${PORT}`);
});
