const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("../models/File");

const mongoURI = process.env.MongoURI || "mongodb+srv://rubengs:gOOD123@cluster0.ayvpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/Translations";

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

// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return {
            filename: file.originalname,
            bucketName: "uploads",
        };
    },
});
const upload = multer({ storage });

function filex(app) {
    app.post("/upload", upload.array("files"), async (req, res) => {
        if (!req.files) {
            return res.status(400).send('File upload failed.');
        }
        
        const fileLinks = [];
        for (const file of req.files) {
            const existingFile = await File.findOne({ originalName: file.originalname });
            if (existingFile) {
                return res.render("overwritePrompt", { fileName: file.originalname });
            }
            const fileData = {
                path: file.id || file._id,
                originalName: file.originalname,
            };
            if (req.body.password != null && req.body.password !== "") {
                fileData.password = await bcrypt.hash(req.body.password, 10);
            }
            const newFile = await File.create(fileData);
            fileLinks.push(`${req.headers.origin}/file/${newFile.id}`);
        }
        
        const files = await File.find({ user: req.user._id });
        res.render("dashboard", { fileLinks, user: req.user, files });
    });

    app.post("/overwrite", upload.array("files"), async (req, res) => {
        if (!req.files) {
            return res.status(400).send('File upload failed.');
        }
        
        const fileLinks = [];
        for (const file of req.files) {
            const existingFile = await File.findOneAndUpdate(
                { originalName: file.originalname },
                {
                    path: file.id || file._id,
                    originalName: file.originalname,
                    password: req.body.password ? await bcrypt.hash(req.body.password, 10) : undefined,
                },
                { new: true }
            );
            fileLinks.push(`${req.headers.origin}/file/${existingFile.id}`);
        }

        const files = await File.find({ user: req.user._id });
        res.render("dashboard", { fileLinks, user: req.user, files });
    });

    app.route("/file/:id").get(handleDownload).post(handleDownload);

    async function handleDownload(req, res) {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send('File not found');
        }
        if (file.password != null) {
            if (req.body.password == null) {
                res.render("password");
                return;
            }
            if (!(await bcrypt.compare(req.body.password, file.password))) {
                res.render("password", { error: true });
                return;
            }
        }

        gfs.openDownloadStream(mongoose.Types.ObjectId(file.path)).pipe(res);
    }

    app.get('/dashboard', async (req, res) => {
        const files = await File.find({ user: req.user._id });
        const fileLinks = files.map(file => `${req.headers.origin}/file/${file.id}`);
        res.render('dashboard', { user: req.user, files, fileLinks });
    });
}

module.exports = filex;
