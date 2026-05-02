const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historiqueController');
//get all history
router.get('/', historyController.getAllHistory);
//change visibility facture in history
router.put(
    '/toggle/:historiqueId/:factureId',
    historyController.toggleVisibilityFacture
);
router.get('/visible', historyController.getVisibleFactures);

router.get('/hidden', historyController.getHiddenFactures);



router.delete(
    '/:historiqueId/:factureId',
    historyController.deleteFactureFromHistory
);

module.exports = router;