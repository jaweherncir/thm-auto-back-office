const mongoose = require('mongoose');

// Définition du schéma pour les éléments de la main-d'œuvre (changement, dressage, réparation)
const tacheSchema = new mongoose.Schema({
  designation: { type: String, required: true },
  prix: { type: Number, required: true }
}, { _id: false }); // _id: false évite de générer un ID pour chaque sous-élément si ce n'est pas nécessaire

// Définition du schéma pour le matériel de peinture
const materielPeintureSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  quantite: { type: Number, required: true },
  prixUnitaire: { type: Number, required: true }
}, { _id: false });

// Schéma principal de la Facture
const factureDeviceSchema = new mongoose.Schema({
  nomAdmin: { type: String, default: "" },
  num_facture: { type: String, required: true, unique: true }, // unique: true est recommandé pour un numéro de facture
  
  client: {
    nom: { type: String, default: "" },
    teleClient: { type: String, default: "" },
    numCarteGrise: { type: String, default: "" },
    matriculeVoiture: { type: String, default: "" }
  },

  dateIntervention: { type: String, default: "" }, // Vous pouvez utiliser Date si vous préférez formater côté backend
  heureFacture: { type: String, default: "" },

  mainOeuvre: {
    changement: [tacheSchema],
    dressage: [tacheSchema],
    reparation: [tacheSchema],
    nombreHeure: { type: Number, required: true },
    prixParHeure: { type: Number, required: true },
    totalMainOeuvre: { type: Number, required: true }
  },

  materielsPeinture: [materielPeintureSchema],

  totalPeinture: { type: Number, required: true },
  totalFinal: { type: Number, required: true }
}, {
  timestamps: true // Optionnel : Ajoute automatiquement 'createdAt' et 'updatedAt'
});

module.exports = mongoose.model('FactureDevice', factureDeviceSchema);