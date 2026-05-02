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
// CHANGE visibility facture
exports.toggleVisibilityFacture = async (req, res) => {
    try {
        const { historiqueId, factureId } = req.params;
        const { visibilite } = req.body;

        const historique = await HistoriqueFactures.findOneAndUpdate(
            {
                _id: historiqueId,
                'facturesMainOeuvre.facture': factureId
            },
            {
                $set: {
                    'facturesMainOeuvre.$.visibilite': visibilite
                }
            },
            { new: true }
        ).populate('facturesMainOeuvre.facture');

        if (!historique) {
            return res.status(404).json({
                success: false,
                message: 'Facture ou historique non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Visibilité modifiée',
            data: historique
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET visible factures only
exports.getVisibleFactures = async (req, res) => {
    try {
        const histories = await HistoriqueFactures.find()
            .populate('facturesMainOeuvre.facture');

        const visibleFactures = histories.map(history => ({
            ...history.toObject(),
            facturesMainOeuvre: history.facturesMainOeuvre.filter(
                item => item.visibilite === true
            )
        }));

        res.status(200).json({
            success: true,
            data: visibleFactures
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
            .populate('facturesMainOeuvre.facture');

        const hiddenFactures = histories
            .map(history => ({
                ...history.toObject(),
                facturesMainOeuvre: history.facturesMainOeuvre.filter(
                    item => item.visibilite === false
                )
            }))
            .filter(history => history.facturesMainOeuvre.length > 0);

        res.status(200).json({
            success: true,
            count: hiddenFactures.length,
            data: hiddenFactures
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};