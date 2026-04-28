require('dotenv').config(); // Load variables from .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const cookieParser = require('cookie-parser');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use('/api', userRoutes); // All routes will start with /api



// Get variables from process.env
const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000; // Fallback to 5000 if not defined

// MongoDB Connection
mongoose.connect(mongoUri)
    .then(() => console.log("Connecté à MongoDB via .env"))
    .catch(err => console.error("Erreur de connexion :", err));

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});