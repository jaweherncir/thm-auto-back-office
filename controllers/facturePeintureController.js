const FacturePeinture = require('../models/facture_peinture');
const HistoriqueFactures = require('../models/historiqueFactures');
const User = require('../models/User');

// CREATE
exports.createFacturePeinture = async (req, res) => {
    try {
        const {
            client,
            numClient,
            numCarteGrise,
            matriculeVoiture,
            nomAdmin,
            materiels,
            locationFour
        } = req.body;

        const adminExists = await User.findOne({ username: nomAdmin });

        if (!adminExists) {
            return res.status(404).json({
                success: false,
                message: "Nom admin introuvable."
            });
        }

        const facture = await FacturePeinture.create({
            client,
            numClient,
            numCarteGrise,
            matriculeVoiture,
            nomAdmin,
            materiels,
            locationFour
        });

        let historique = await HistoriqueFactures.findOne({ nomAdmin });

        if (!historique) {
            historique = await HistoriqueFactures.create({
                nomAdmin,
                facturesPeinture: [{ facture: facture._id }]
            });
        } else {
            historique.facturesPeinture.push({
                facture: facture._id
            });

            await historique.save();
        }

        res.status(201).json({
            success: true,
            message: "Facture peinture créée + ajout historique.",
            data: facture
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur.",
            error: error.message
        });
    }
};


// GET ALL
exports.getAllFacturesPeinture = async (req, res) => {
    try {
        const factures = await FacturePeinture.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: factures.length,
            data: factures
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération factures.",
            error: error.message
        });
    }
};


// GET BY ID
exports.getFacturePeintureById = async (req, res) => {
    try {
        const facture = await FacturePeinture.findById(req.params.id);

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: "Facture introuvable."
            });
        }

        res.status(200).json({
            success: true,
            data: facture
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur serveur.",
            error: error.message
        });
    }
};


// UPDATE
exports.updateFacturePeinture = async (req, res) => {
    try {
        const facture = await FacturePeinture.findById(req.params.id);

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: "Facture introuvable."
            });
        }

        const {
            client,
            numClient,
            numCarteGrise,
            matriculeVoiture,
            nomAdmin,
            materiels,
            locationFour
        } = req.body;

        facture.client = client || facture.client;
        facture.numClient = numClient || facture.numClient;
        facture.numCarteGrise = numCarteGrise || facture.numCarteGrise;
        facture.matriculeVoiture = matriculeVoiture || facture.matriculeVoiture;
        facture.nomAdmin = nomAdmin || facture.nomAdmin;
        facture.materiels = materiels || facture.materiels;
        facture.locationFour = locationFour ?? facture.locationFour;

        await facture.save();

        res.status(200).json({
            success: true,
            message: "Facture mise à jour avec succès.",
            data: facture
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur modification facture.",
            error: error.message
        });
    }
};


// DELETE
exports.deleteFacturePeinture = async (req, res) => {
    try {
        const facture = await FacturePeinture.findByIdAndDelete(req.params.id);

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: "Facture introuvable."
            });
        }

        res.status(200).json({
            success: true,
            message: "Facture supprimée avec succès."
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur suppression facture.",
            error: error.message
        });
    }
};