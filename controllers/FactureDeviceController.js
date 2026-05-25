const mongoose = require('mongoose');
const Facture = require('../models/facturesDevice'); // Chemin vers FactureDevice
const User = require('../models/User'); // Chemin vers votre modèle User (vérifiez le nom du fichier)
const Historique = require('../models/historiqueFactures'); // Chemin vers HistoriqueFactures

// Fonction utilitaire pour générer le numéro de facture automatique (Ex: Facture_device:2026.01)
const genererNumeroFacture = async () => {
  const anneeEnCours = new Date().getFullYear(); // Récupère l'année courante (ex: 2026)
  
  // Préparer le préfixe de recherche (ex: "Facture_device:2026.")
  // Le \\. permet d'échapper le point dans l'expression régulière
  const prefixeRecherche = `Facture_device:${anneeEnCours}\\.`;

  // Cherche la dernière facture créée pour l'année en cours avec ce format
  const derniereFacture = await Facture.findOne({
    num_facture: new RegExp(`^${prefixeRecherche}`)
  }).sort({ createdAt: -1 });

  let prochainNumero = 1;

  if (derniereFacture && derniereFacture.num_facture) {
    // Extrait le compteur actuel (ex: "Facture_device:2026.01" -> on coupe au niveau du point ".")
    const parties = derniereFacture.num_facture.split('.');
    
    // parties[1] contient le numéro (ex: "01")
    const compteurActuel = parseInt(parties[1], 10);
    
    if (!isNaN(compteurActuel)) {
      prochainNumero = compteurActuel + 1;
    }
  }

  // Formate sur 2 chiffres minimum (ex: 1 -> "01", 9 -> "09", 10 -> "10")
  const numeroFormate = String(prochainNumero).padStart(2, '0');
  
  // Retourne le format final exact : Facture_device:2026.01
  return `Facture_device:${anneeEnCours}.${numeroFormate}`;
};
// 1. AJOUTER une facture avec vérifications et historique
exports.createFacture = async (req, res) => {
  // On démarre une session pour la transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { nomAdmin } = req.body;

    // TEST 1 : Vérifier si nomAdmin est fourni
    if (!nomAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Le nom de l'administrateur (nomAdmin) est obligatoire." });
    }

    // TEST 2 : Vérifier si l'admin existe dans la collection Users (nomAdmin === username)
    const userExiste = await User.findOne({ username: nomAdmin }).session(session);
    if (!userExiste) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: `L'utilisateur '${nomAdmin}' n'existe pas dans la base de données.` });
    }

    // AUTOMATISATION : Génération du numéro de facture unique
    const numFactureAuto = await genererNumeroFacture();

    // Création de l'objet facture avec le numéro généré
    const nouvelleFactureData = {
      ...req.body,
      num_facture: numFactureAuto
    };

    const nouvelleFacture = new Facture(nouvelleFactureData);
    // On passe la session pour inclure l'action dans la transaction
    const factureEnregistree = await nouvelleFacture.save({ session });

    // AJOUT À L'HISTORIQUE : On cherche si un historique existe déjà pour cet admin
    let historiqueAdmin = await Historique.findOne({ nomAdmin }).session(session);

    if (!historiqueAdmin) {
      // S'il n'existe pas, on crée un nouvel historique pour cet admin
      historiqueAdmin = new Historique({
        nomAdmin: nomAdmin,
        facturesMainOeuvre: [],
        facturesPeinture: [],
        facturesDevice: []
      });
    }

    // On pousse la nouvelle facture dans le tableau 'facturesDevice' de l'historique
    historiqueAdmin.facturesDevice.push({
      facture: factureEnregistree._id,
      visibilite: true
    });

    // Sauvegarde de l'historique avec la session
    await historiqueAdmin.save({ session });

    // Si tout s'est bien passé, on valide définitivement toutes les opérations
    await session.commitTransaction();
    session.endSession();

    // On renvoie la facture enregistrée
    res.status(201).json(factureEnregistree);

  } catch (error) {
    // En cas d'erreur, on annule tout ce qui a été fait durant la session
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      return res.status(400).json({ message: "Ce numéro de facture généré existe déjà." });
    }
    res.status(500).json({ message: "Erreur lors de la création de la facture et de l'historique", error: error.message });
  }
};
// 2. RECUPERER TOUTES les factures (Get All)
exports.getAllFactures = async (req, res) => {
  try {
    const factures = await Facture.find();
    res.status(200).json(factures);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};

// 3. RECUPERER UNE facture par son ID (Get One)
exports.getOneFacture = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id);
    if (!facture) {
      return res.status(404).json({ message: "Facture introuvable" });
    }
    res.status(200).json(facture);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
  }
};
exports.updateFacture = async (req, res) => {
  try {
    // 1. Nettoyer et décoder l'identifiant pour gérer les caractères complexes (: et .)
    const numFactureCible = decodeURIComponent(req.params.id).trim();

    // 2. SÉCURITÉ : On extrait num_facture du body pour l'empêcher de changer
    // Même si l'utilisateur envoie un nouveau num_facture, il sera totalement ignoré
    const { num_facture, ...donneesAModifier } = req.body;

    // 3. Recherche par num_facture et mise à jour
    const factureModifiee = await Facture.findOneAndUpdate(
      { num_facture: numFactureCible }, 
      { $set: donneesAModifier },       
      { new: true, runValidators: true }
    );
    
    if (!factureModifiee) {
      return res.status(404).json({ 
        message: `Facture '${numFactureCible}' introuvable pour modification. Vérifiez l'identifiant envoyé.` 
      });
    }
    
    res.status(200).json(factureModifiee);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification", error: error.message });
  }
};
// 5. SUPPRIMER une facture (Delete) et la retirer de l'historique
exports.deleteFacture = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const idFacture = req.params.id;

    // SÉCURITÉ 1 : Convertir explicitement la chaîne en ObjectId Mongoose
    const objectIdFacture = new mongoose.Types.ObjectId(idFacture);

    // 1. Chercher et supprimer la facture dans la collection FactureDevice
    const factureSupprimee = await Facture.findByIdAndDelete(objectIdFacture).session(session);
    
    if (!factureSupprimee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Facture introuvable pour suppression" });
    }

    // 2. Retirer la référence de cette facture dans la collection historique_factures
    // Utilisation de l'ObjectId converti pour le filtre et le $pull
    await Historique.updateMany(
      { "facturesDevice.facture": objectIdFacture },
      { 
        $pull: { 
          facturesDevice: { facture: objectIdFacture } 
        } 
      }
    ).session(session);

    // Si les deux opérations ont réussi, on valide la transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Facture supprimée et retirée de l'historique avec succès !" });

  } catch (error) {
    // En cas de problème, on annule toutes les modifications (Rollback)
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la facture et de son historique", 
      error: error.message 
    });
  }
};