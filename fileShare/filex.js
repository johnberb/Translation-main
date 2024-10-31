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
    app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('File upload failed.');
    }
    const fileData = {
        path: req.file.id || req.file._id, // Use _id if id is undefined
        originalName: req.file.originalname,
    };
    if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10);
    }
    const file = await File.create(fileData);
    const files = await File.find({user: req.user._id})
    res.render("dashboard", { fileLink: `${req.headers.origin}/file/${file.id}`, user: req.user,files:files });
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
    const fileLink = files.length > 0 ? `${req.headers.origin}/file/${files[0].id}` : null;
    res.render('dashboard', { user: req.user, files: files, fileLink: fileLink });
});
}

module.exports = filex;
