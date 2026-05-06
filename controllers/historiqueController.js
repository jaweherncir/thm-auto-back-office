const HistoriqueFactures = require('../models/historiqueFactures');
const FacturMainOeuvre = require('../models/facturMainOeuvre');
exports.getAllHistory = async (req, res) => {
    try {
        const history = await HistoriqueFactures.find()
            .populate('facturesMainOeuvre.facture')
            .sort({ createdAt: -1 });

        // nombre total des historiques
        const countHistory = history.length;

        // nombre total des factures
        const countFactures = history.reduce(
            (total, item) => total + item.facturesMainOeuvre.length,
            0
        );

        res.status(200).json({
            success: true,
            countHistory,
            countFactures,
            data: history
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.deleteFactureFromHistory = async (req, res) => {
    try {
        const { historiqueId, factureId } = req.params;

        const historique = await HistoriqueFactures.findById(historiqueId);

        if (!historique) {
            return res.status(404).json({
                success: false,
                message: 'Historique non trouvé'
            });
        }

        // 🔥 comparaison SAFE ObjectId
        const item = historique.facturesMainOeuvre.find(
            f => f.facture.toString() === factureId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée dans l’historique'
            });
        }

        const factureSupprimee = await FacturMainOeuvre.findById(factureId);

        historique.facturesMainOeuvre = historique.facturesMainOeuvre.filter(
            f => f.facture.toString() !== factureId
        );

        await historique.save();

        return res.status(200).json({
            success: true,
            message: 'Facture supprimée de l’historique',
            data: factureSupprimee
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.changeFactureVisibility = async (req, res) => {
    try {
        const { historiqueId, type, factureId } = req.params;

        if (!historiqueId || !type || !factureId) {
            return res.status(400).json({
                success: false,
                message: "historiqueId, type et factureId sont requis"
            });
        }

        const historique = await HistoriqueFactures.findById(historiqueId);

        if (!historique) {
            return res.status(404).json({
                success: false,
                message: "Historique introuvable"
            });
        }

  const mapping = {
    mainOeuvre: "facturesMainOeuvre",
    peinture: "facturesPeinture",
    device: "facturesDevice"
};

        const field = mapping[type];

        if (!field) {
            return res.status(400).json({
                success: false,
                message: "Type invalide (mainOeuvre | peinture | device)"
            });
        }

        const item = historique[field].find(
            f => f.facture.toString() === factureId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Facture introuvable dans l’historique"
            });
        }

        // toggle visibilité
        item.visibilite = !item.visibilite;

        await historique.save();

        return res.status(200).json({
            success: true,
            message: "Visibilité modifiée avec succès",
            data: {
                historiqueId,
                factureId,
                type,
                visibilite: item.visibilite
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};
// GET visible factures only
exports.getVisibleFactures = async (req, res) => {
    try {
        const histories = await HistoriqueFactures.find()
            .populate('facturesMainOeuvre.facture')
            .populate('facturesPeinture.facture');
            //.populate('facturesDevice.facture');

        const result = histories.map(history => {
            const h = history.toObject();

            return {
                ...h,
                facturesMainOeuvre: h.facturesMainOeuvre.filter(f => f.visibilite === true),
                facturesPeinture: h.facturesPeinture.filter(f => f.visibilite === true),
                //facturesDevice: h.facturesDevice.filter(f => f.visibilite === true)
            };
        });

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getHiddenFactures = async (req, res) => {
    try {
        const histories = await HistoriqueFactures.find()
            .populate('facturesMainOeuvre.facture')
            .populate('facturesPeinture.facture');
           // .populate('facturesDevice.facture');

        const result = histories
            .map(history => {
                const h = history.toObject();

                return {
                    ...h,
                    facturesMainOeuvre: h.facturesMainOeuvre.filter(f => f.visibilite === false),
                    facturesPeinture: h.facturesPeinture.filter(f => f.visibilite === false),
                    //facturesDevice: h.facturesDevice.filter(f => f.visibilite === false)
                };
            })
            .filter(h =>
                h.facturesMainOeuvre.length > 0 ||
                h.facturesPeinture.length > 0 
                //h.facturesDevice.length > 0
            );

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};