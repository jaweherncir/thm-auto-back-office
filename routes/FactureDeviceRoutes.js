const express = require('express');
const router = express.Router();
const factureCtrl = require('../controllers/FactureDeviceController'); // Ajustez le chemin vers votre contrôleur

// Route pour ajouter une facture
router.post('/', factureCtrl.createFacture);

// Route pour récupérer toutes les factures
router.get('/', factureCtrl.getAllFactures);

// Route pour récupérer une seule facture grâce à son ID Mongoose
router.get('/:id', factureCtrl.getOneFacture);

// Route pour modifier une facture grâce à son ID Mongoose
router.put('/:id', factureCtrl.updateFacture);

// Route pour supprimer une facture grâce à son ID Mongoose
router.delete('/:id', factureCtrl.deleteFacture);

module.exports = router;