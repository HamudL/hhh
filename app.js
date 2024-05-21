const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = express();

// MongoDB Connection
mongoose.connect('mongodb://localhost/myGalleryDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema for Images
const imageSchema = new mongoose.Schema({
    filename: String,
    path: String,
    uploadDate: { type: Date, default: Date.now }
});

const Image = mongoose.model('Image', imageSchema);

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir, { recursive: true });

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Home page route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// File upload route
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const newImage = new Image({
        filename: req.file.filename,
        path: req.file.path
    });
    newImage.save()
        .then(() => res.redirect('/gallery'))
        .catch(err => res.status(500).send(err.message));
});

// Dynamic gallery route
app.get('/gallery', async (req, res) => {
    try {
        const images = await Image.find().sort({ uploadDate: -1 });
        res.json(images.map(img => {
            return { src: `/uploads/${img.filename}`, alt: `Uploaded Image` }
        }));
    } catch (err) {
        console.error('Failed to retrieve images:', err);
        res.status(500).send('Failed to retrieve images');
    }
});

// Server setup
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
