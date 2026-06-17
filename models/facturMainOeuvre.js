const mongoose = require('mongoose');

const facturMainOeuvreSchema = new mongoose.Schema({
    // AJOUT : Numéro de facture automatique unique
    num_facture: {
    type: String,
    required: true,
        unique: true
    },
    nomAdmin: { type: String, required: true },
    dateFacture: { type: Date, default: Date.now },
    nomClient: { type: String, required: true },
    numeroClient: { type: String, required: true },
    teleClient: { type: String, required: true },
    numCarteGrise: { type: String, required: true },
    matriculeVoiture: { type: String, required: true },
    dateIntervention: { type: Date, required: true },
    changement: [
        {
            designation: String,
        }
    ],
    dressage: [
        {
            designation: String,
        }
    ],
    reparation: [
        {
            designation: String,
        }
    ],

    totalMainOeuvre: { type: Number, required: true },
tva: { type: Number },
    ttc: { type: Number }
}, {
    timestamps: true,
    collection: 'factur_main_oeuvre'
});

module.exports = mongoose.model('FacturMainOeuvre', facturMainOeuvreSchema);