const mongoose = require('mongoose');

const materielSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    quantite: {
        type: Number,
        required: true,
        min: 1
    },
    prixUnitaire: {
        type: Number,
        required: true
    },
    total: {
        type: Number
    }
});

const facturePeintureSchema = new mongoose.Schema({
    client: {
        type: String,
        required: true
    },

    numClient: {
        type: String,
        required: true
    },

    numCarteGrise: {
        type: String,
        required: true
    },

    matriculeVoiture: {
        type: String,
        required: true
    },

    nomAdmin: {
        type: String,
        required: true
    },

    materiels: [materielSchema],

    totalHT: {
        type: Number,
        default: 0
    },

    tva: {
        type: Number,
        default: 19
    },

    montantTVA: {
        type: Number,
        default: 0
    },

    totalTTC: {
        type: Number,
        default: 0
    },

    dateFacture: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'facture_peinture'
});

facturePeintureSchema.pre('save', function (next) {
    let totalHT = 0;

    this.materiels.forEach(item => {
        item.total = item.quantite * item.prixUnitaire;
        totalHT += item.total;
    });

    this.totalHT = totalHT;
    this.montantTVA = totalHT * (this.tva / 100);
    this.totalTTC = totalHT + this.montantTVA;

   
});

module.exports = mongoose.model('FacturePeinture', facturePeintureSchema);