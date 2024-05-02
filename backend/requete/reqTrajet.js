import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './reqUtilisateurs.js';

const prisma = new PrismaClient();
const router = express.Router();

// Routeur GET pour récupérer tous les trajets
router.get('/', authenticateToken, async (req, res) => {
    try {
        const trajets = await prisma.trajet.findMany();
        res.status(200).json(trajets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des trajets');
    }
});

// Routeur GET pour récupérer les trajets où l'utilisateur est conducteur
router.get('/conducteur/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(conducteur) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const trajets = await prisma.trajet.findMany({
            where: { conducteur: parseInt(id) }
        });
        res.status(200).json(trajets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des trajets');
    }
});

// Routeur GET pour récupérer les trajets où l'utilisateur est passager
router.get('/passager', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.decoded;
    try {
        const trajets = await prisma.trajet.findMany({
            where: {
                estPassager: {
                    some: { passager: userId } // Utiliser l'userId du token JWT directement car je n'arrivais pas à faire autrement
                }
            }
        });
        res.status(200).json(trajets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des trajets');
    }
});

// Routeur POST pour ajouter un nouveau trajet
router.post('/', authenticateToken, async (req, res) => {
    const { villedepart, villearrivee, heuredepart, heurearrivee, prix, conducteur } = req.body;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(conducteur) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const nouveauTrajet = await prisma.trajet.create({
            data: {
                villedepart,
                villearrivee,
                heuredepart,
                heurearrivee,
                prix,
                conducteur: parseInt(conducteur)
            }
        });
        res.status(201).json(nouveauTrajet);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de l\'ajout du trajet');
    }
});

// Routeur PUT pour mettre à jour un trajet en fonction de son identifiant
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { villedepart, villearrivee, heuredepart, heurearrivee, prix, conducteur } = req.body;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(conducteur) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const trajetUpdated = await prisma.trajet.update({
            where: { idtrajet: parseInt(id) },
            data: {
                villedepart,
                villearrivee,
                heuredepart,
                heurearrivee,
                prix,
                conducteur: parseInt(conducteur)
            }
        });
        res.status(200).json(trajetUpdated);
    } catch (err) {
        if (err.code === 'P2025') {
            res.status(404).send('Aucun trajet trouvé avec cet identifiant');
        } else {
            console.error(err.message);
            res.status(500).send('Erreur lors de la mise à jour du trajet');
        }
    }
});

// Routeur DELETE pour supprimer un trajet en fonction de son identifiant
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(conducteur) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        // Supprimer d'abord les enregistrements correspondants dans la table estPassager
        await prisma.estPassager.deleteMany({
            where: { trajet: parseInt(id) }
        });

        // Ensuite, supprimer le trajet
        const deleteTrajet = await prisma.trajet.delete({
            where: { idtrajet: parseInt(id) }
        });
        res.status(200).send('Trajet supprimé avec succès');
    } catch (err) {
        if (err.code === 'P2025') {
            res.status(404).send('Aucun trajet trouvé avec cet identifiant');
        } else {
            console.error(err.message);
            res.status(500).send('Erreur lors de la suppression du trajet');
        }
    }
});

// Routeur POST pour ajouter un passager à un trajet
router.post('/ajouter-passager', authenticateToken, async (req, res) => {
    const { idTrajet, idPassager } = req.body;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(idPassager) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        // Ajouter un passager à un trajet spécifique
        const nouveauPassager = await prisma.estPassager.create({
            data: {
                idTrajet,
                idPassager
            }
        });
        res.status(201).json(nouveauPassager);
    } catch (err) {
        console.error(err.message);
        // Gestion des erreurs pour les contraintes, comme les doublons de passagers dans le même trajet
        if (err.code === 'P2002') {
            res.status(409).send('Le passager est déjà inscrit sur ce trajet');
        } else {
            res.status(500).send('Erreur lors de l\'ajout du passager au trajet');
        }
    }
});

export default router;
