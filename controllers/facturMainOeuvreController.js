const FacturMainOeuvre = require('../models/facturMainOeuvre');
const HistoriqueFactures = require('../models/historiqueFactures');
const User = require('../models/User');
// CREATE facture
exports.createFacture = async (req, res) => {
    try {
        const {
            changement = [],
            dressage = [],
            reparation = [],
            nombreHeure,
            prixParHeure,
            tva = 19,
            nomAdmin
        } = req.body;

        // vérifier admin ou sous-admin
        const admin = await User.findOne({
            username: nomAdmin,
            role: { $in: ['admin', 'sous-admin'] }
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non autorisé à créer une facture"
            });
        }

        const totalChangement = changement.reduce(
            (sum, item) => sum + (item.prix || 0),
            0
        );

        const totalDressage = dressage.reduce(
            (sum, item) => sum + (item.prix || 0),
            0
        );

        const totalReparation = reparation.reduce(
            (sum, item) => sum + (item.prix || 0),
            0
        );

        const totalMainOeuvre = nombreHeure * prixParHeure;

        const totalHT =
            totalChangement +
            totalDressage +
            totalReparation +
            totalMainOeuvre;

        const ttc = totalHT + (totalHT * tva / 100);

        const facture = new FacturMainOeuvre({
            ...req.body,
            totalMainOeuvre,
            ttc
        });

        await facture.save();

        let historique = await HistoriqueFactures.findOne({
            nomAdmin
        });

        if (!historique) {
            historique = new HistoriqueFactures({
                nomAdmin,
                facturesMainOeuvre: []
            });
        }

        historique.facturesMainOeuvre.push({
            facture: facture._id,
            visibilite: true
        });

        await historique.save();

        res.status(201).json({
            success: true,
            message: 'Facture créée avec succès',
            data: facture
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET all factures
exports.getAllFactures = async (req, res) => {
    try {
        const factures = await FacturMainOeuvre.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: factures.length,
            data: factures
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET facture by id
exports.getFactureById = async (req, res) => {
    try {
        const facture = await FacturMainOeuvre.findById(req.params.id);

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: facture
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE facture
exports.deleteFacture = async (req, res) => {
    try {
        const facture = await FacturMainOeuvre.findByIdAndDelete(req.params.id);

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Facture supprimée'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateFacture = async (req, res) => {
    try {
        let facture = await FacturMainOeuvre.findById(req.params.id);

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: "Facture non trouvée"
            });
        }

        // 1. Merge données existantes + nouvelles données
        const data = {
            ...facture.toObject(),
            ...req.body
        };

        const {
            changement = [],
            dressage = [],
            reparation = [],
            nombreHeure,
            prixParHeure,
            tva = 19
        } = data;

        // 2. Recalcul des totaux pièces/services
        const totalChangement = changement.reduce((sum, item) => sum + (item.prix || 0), 0);
        const totalDressage = dressage.reduce((sum, item) => sum + (item.prix || 0), 0);
        const totalReparation = reparation.reduce((sum, item) => sum + (item.prix || 0), 0);

        // 3. Recalcul main d’œuvre
        const totalMainOeuvre = (nombreHeure || 0) * (prixParHeure || 0);

        // 4. Total HT
        const totalHT =
            totalChangement +
            totalDressage +
            totalReparation +
            totalMainOeuvre;

        // 5. TTC recalculé
        const ttc = totalHT + (totalHT * tva / 100);

        // 6. Update final
        facture.changement = changement;
        facture.dressage = dressage;
        facture.reparation = reparation;
        facture.nombreHeure = nombreHeure;
        facture.prixParHeure = prixParHeure;
        facture.tva = tva;

        facture.totalMainOeuvre = totalMainOeuvre;
        facture.ttc = ttc;

        await facture.save();

        res.status(200).json({
            success: true,
            message: "Facture mise à jour avec recalcul",
            data: facture
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};