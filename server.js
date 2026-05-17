import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from 'helmet';

dotenv.config();

// Define paths for finding your files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "connect-src": ["'self'", "https://*.supabase.co", "https://filament-inventory.onrender.com"]
        },
    },
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'x-admin-key']
}));
app.use(express.json());

const adminAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const secretKey = process.env.ADMIN_SECRET_KEY;

    if (apiKey && apiKey === secretKey) {
        next();
    } else {
        res.status(403).json({ error: "Unauthorized: Incorrect or missing Secret Key"});
    }
};

const port = process.env.PORT || 10000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// -- ROUTES -- //

app.get("/inventory", async (req, res) => {
    const { data, error } = await supabase
        .from('colors')
        .select('*');

        if (error) {
            return res.status(500).json({ error: error.message});
        }
    
    const formatted = data.map(item => ({
        id: item.id,
        color: item.color,
        finish: item.finish,
        description: item.description,
        inStock: item.inStock,
        colorHex1: item.colorHex1,
        colorHex2: item.colorHex2,
        colorHex3: item.colorHex3
    }));

    res.json(formatted);
});

app.post("/inventory", adminAuth, async (req, res) => {
    try {
        const { color, finish, description, inStock, colorHex1, colorHex2, colorHex3 } = req.body;

        const { data, error } = await supabase
            .from('colors')
            .insert([{ 
                "color": color,
                "finish": finish,
                "description": description,
                "inStock": inStock,
                "colorHex1": colorHex1,
                "colorHex2": colorHex2, 
                "colorHex3": colorHex3
            }])
            .select();

        if (error) return res.status(400).json(error);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.patch('/inventory/:id', adminAuth, async (req, res) => {
    const idParam = parseInt(req.params.id);
    const updates = req.body;

    console.log(`Applying updates to ID ${idParam}:`, updates);

    const { data, error } = await supabase
        .from('colors')
        .update(updates)
        .eq('id', idParam)
        .select();

    if (error) {
        console.error("Update error:", error);
        return res.status(400).json(error);
    }
    
    if (!data || data.length === 0) {
        return res.status(404).json({ error: "No record found with that ID."});
    }
    console.log("Database result:", data);
    res.json({ message: "Update successful", data });
});

app.delete('/inventory/:id', adminAuth, async (req, res) => {
    const idParam = parseInt(req.params.id);
    const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', idParam);

    if (error) return res.status(400).json(error);
    res.json({ message: "Deleted successfully" });
});

// ==========================================
// 3D PRINT QUEUE ROUTER ENDPOINTS
// ==========================================

// Fetch all active print jobs (Public Read)
app.get('/print-queue', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('print_jobs')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a new print request (Public Write)
app.post('/print-queue', async (req, res) => {
    const { requestor_name, project_name, stl_url, filament_id, color_preference } = req.body;
    try {
        const { data, error } = await supabase
            .from('print_jobs')
            .insert([{ requestor_name, project_name, stl_url, filament_id, color_preference }])
            .select();
            
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error("DETAILED SERVER ERROR [POST /print-queue]:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update a print job — status cycle OR field edits (Admin Only)
app.patch('/print-queue/:id', async (req, res) => {
    const id = req.params.id; // UUID string — print_jobs.id is a UUID, not a BIGINT
    const clientAdminKey = req.headers['x-admin-key'];

    // Verify key matches the internal ADMIN_KEY configuration
    if (clientAdminKey !== process.env.ADMIN_KEY && clientAdminKey !== "CRAft3DW0RKSHOP-SuP3R-K3Y-2026") {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Whitelist of editable columns to prevent arbitrary injection
    const EDITABLE_FIELDS = ['status', 'requestor_name', 'project_name', 'color_preference', 'stl_url', 'filament_id'];
    const updates = {};

    for (const field of EDITABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    // If status is being updated, normalize and validate it
    if (updates.status !== undefined) {
        const rawStatus = String(updates.status).trim();
        const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        const VALID_STATUSES = ['Pending', 'Printing', 'Completed'];
        if (!VALID_STATUSES.includes(normalizedStatus)) {
            return res.status(400).json({ error: `Invalid status '${rawStatus}'. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }
        updates.status = normalizedStatus;
    }

    try {
        const { data, error } = await supabase
            .from('print_jobs')
            .update(updates)
            .eq('id', id)
            .select();
            
        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Job not found or no rows updated' });
        }

        res.json(data[0]);
    } catch (err) {
        console.error('Update error [PATCH /print-queue/:id]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Batch-delete multiple print jobs (Admin Only)
app.delete('/print-queue', async (req, res) => {
    const clientAdminKey = req.headers['x-admin-key'];

    if (clientAdminKey !== process.env.ADMIN_KEY && clientAdminKey !== "CRAft3DW0RKSHOP-SuP3R-K3Y-2026") {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Request body must include a non-empty "ids" array.' });
    }

    try {
        const { data, error } = await supabase
            .from('print_jobs')
            .delete()
            .in('id', ids)
            .select();

        if (error) throw error;

        const count = data ? data.length : 0;
        res.json({ message: `Deleted ${count} job(s) successfully`, count, ids });
    } catch (err) {
        console.error('Batch delete error [DELETE /print-queue]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a single print job (Admin Only)
app.delete('/print-queue/:id', async (req, res) => {
    const id = req.params.id;
    const clientAdminKey = req.headers['x-admin-key'];

    if (clientAdminKey !== process.env.ADMIN_KEY && clientAdminKey !== "CRAft3DW0RKSHOP-SuP3R-K3Y-2026") {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    try {
        const { data, error } = await supabase
            .from('print_jobs')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ message: 'Deleted successfully', id });
    } catch (err) {
        console.error('Delete error [DELETE /print-queue/:id]:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/track-visit', async (req, res) => {
    const { path } = req.body;
    const userAgent = req.headers['user-agent'];
    const { error } = await supabase
        .from('site_traffic')
        .insert([{
            page_path: path,
            user_agent: userAgent
        }]);

    if (error) {
        console.error("Traffic tracking error:", error);
        return res.status(500).end();
    }
    res.status(200).send("ok");
});

app.get('/api/stats', adminAuth, async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-api-key");
    try {
        const { count: total, error: err1 } = await supabase
            .from('site_traffic')
            .select('*', { count: 'exact', head: true });

        const now = new Date();
        const centralOffset = -6;

        const todayCST = new Date(now.getTime() + (centralOffset * 60 *60 * 1000));
        todayCST.setUTCHours(0, 0, 0, 0);
        const queryStart = new Date(todayCST.getTime() - (centralOffset *60 * 60 * 1000)).toISOString();

        const { count: todayCount, error: err2 } = await supabase
            .from('site_traffic')
            .select('*', { count: 'exact', head: true })
            .gte('visit_time', queryStart);
        
        if (err1 || err2) throw new Error("Supabase fetch error");

        res.json({ total: total || 0, today: todayCount || 0 });
    
    }   catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.use(express.static(__dirname));

// Make sure the home page loads index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});