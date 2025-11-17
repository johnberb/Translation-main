const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("../models/File");
const { Readable } = require('stream');

let mongoURI = process.env.MONGODB_KEY;
// Remove quotes if present
if (mongoURI && (mongoURI.startsWith('"') || mongoURI.startsWith("'"))) {
    mongoURI = mongoURI.slice(1, -1);
}

// Create mongoose connection
const conn = mongoose.createConnection(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Init gfs
let gfs;
conn.once("open", () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "uploads",
    });
});

// Use memory storage and write to GridFSBucket manually to avoid issues
const upload = multer({ storage: multer.memoryStorage() });

function filex(app) {
    app.post("/upload", upload.single("file"), async (req, res) => {
        console.log("[DEBUG] incoming upload, req.file:", req.file ? { originalname: req.file.originalname, size: req.file.size } : null);
        if (!req.file || !req.file.buffer) {
            return res.status(400).send('File upload failed. No file uploaded.');
        }

        if (!gfs) {
            console.error('[ERROR] GridFSBucket not initialized yet');
            return res.status(500).send('Upload failed: storage not initialized');
        }

        try {
            // Check for existing file by name
            const existingFile = await File.findOne({ originalName: req.file.originalname });
            if (existingFile) {
                return res.render("overwritePrompt", { fileName: req.file.originalname });
            }

            // Create a readable stream from the buffer and pipe to GridFS
            const readStream = new Readable();
            readStream.push(req.file.buffer);
            readStream.push(null);

            const uploadStream = gfs.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype
            });

            readStream.pipe(uploadStream);

            uploadStream.on('error', (err) => {
                console.error('[ERROR] uploadStream error:', err);
                return res.status(500).send('Error while writing file to storage');
            });

            uploadStream.on('finish', async (fileDoc) => {
                try {
                    console.log('[DEBUG] upload finished, fileDoc:', fileDoc);
                    const fileData = {
                        path: fileDoc._id ? fileDoc._id.toString() : null,
                        originalName: fileDoc.filename,
                    };
                    if (req.body.password != null && req.body.password !== "") {
                        fileData.password = await bcrypt.hash(req.body.password, 10);
                    }
                    const saved = await File.create(fileData);
                    const userId = req.user ? req.user._id : null;
                    const files = userId ? await File.find({ user: userId }) : [];
                    res.render("dashboard", { fileLink: `${req.headers.origin}/file/${saved.id}`, user: req.user, files: files });
                } catch (err) {
                    console.error('[ERROR] Exception after upload finish:', err);
                    res.status(500).send('Internal server error after file upload');
                }
            });
        } catch (err) {
            console.error('[ERROR] Exception during upload flow:', err);
            res.status(500).send('Internal server error during upload');
        }
    });
   //create a post request for overwriting the file
    app.post("/overwrite", upload.single("file"), async (req, res) => {
        if (!req.file || !req.file.buffer) {
            return res.status(400).send('File upload failed. No file uploaded.');
        }
        if (!gfs) {
            console.error('[ERROR] GridFSBucket not initialized yet (overwrite)');
            return res.status(500).send('Upload failed: storage not initialized');
        }

        try {
            // Find existing DB record to determine old path
            const oldRecord = await File.findOne({ originalName: req.file.originalname });

            // Upload new file to GridFS
            const readStream = new Readable();
            readStream.push(req.file.buffer);
            readStream.push(null);

            const uploadStream = gfs.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype
            });
            readStream.pipe(uploadStream);

            uploadStream.on('error', (err) => {
                console.error('[ERROR] overwrite uploadStream error:', err);
                return res.status(500).send('Error while writing file to storage');
            });

            uploadStream.on('finish', async (fileDoc) => {
                try {
                    // Delete old GridFS file if present
                    if (oldRecord && oldRecord.path) {
                        try {
                            const oldId = mongoose.Types.ObjectId(oldRecord.path);
                            await gfs.delete(oldId);
                        } catch (e) {
                            console.warn('[WARN] Could not delete old GridFS file:', e.message);
                        }
                    }

                    // Update or create DB record
                    const newData = {
                        path: fileDoc._id ? fileDoc._id.toString() : null,
                        originalName: fileDoc.filename,
                        password: req.body.password ? await bcrypt.hash(req.body.password, 10) : undefined
                    };

                    const existingFile = await File.findOneAndUpdate(
                        { originalName: req.file.originalname },
                        newData,
                        { new: true, upsert: true }
                    );

                    const userId2 = req.user ? req.user._id : null;
                    const files = userId2 ? await File.find({ user: userId2 }) : [];
                    res.render("dashboard", { fileLink: `${req.headers.origin}/file/${existingFile.id}`, user: req.user, files: files });
                } catch (err) {
                    console.error('[ERROR] Exception after overwrite finish:', err);
                    res.status(500).send('Internal server error after overwrite');
                }
            });
        } catch (err) {
            console.error('[ERROR] Exception during overwrite flow:', err);
            res.status(500).send('Internal server error during overwrite');
        }
    });

    app.route("/file/:id").get(handleDownload).post(handleDownload);

    async function handleDownload(req, res) {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send('File not found');
        }
        if (file.password != null) {
            if (req.body.password == null || req.body.password === "") {
                // First time, show prompt with no error
                return res.render("password", { error: false });
            }
            if (!(await bcrypt.compare(req.body.password, file.password))) {
                // Only show error if password was submitted and is wrong
                return res.render("password", { error: true });
            }
        }

        // Set headers to force download instead of opening in browser
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        gfs.openDownloadStream(mongoose.Types.ObjectId(file.path)).pipe(res);
    }
      app.get('/dashboard', async (req, res) => {
    const files = await File.find({ user: req.user._id });
    const fileLink = files.length > 0 ? `${req.headers.origin}/file/${files[0].id}` : null;
    res.render('dashboard', { user: req.user, files: files, fileLink: fileLink });
});
}

module.exports = filex;
