import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './reqUtilisateurs.js';
import { verifyTokenAndGetAdminStatus } from './reqUtilisateurs.js';
router.use(verifyTokenAndGetAdminStatus);
const prisma = new PrismaClient();
const router = express.Router();

// GET: Récupérer toutes les voitures
router.get('/', authenticateToken, async (req, res) => {
    try {
        const voitures = await prisma.voiture.findMany();
        res.status(200).json(voitures);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des voitures');
    }
});

// GET: Récupérer toutes les voitures d'un propriétaire spécifique
router.get('/par-proprietaire/:proprietaireId', authenticateToken, async (req, res) => {
    const { proprietaireId } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(proprietaire) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const voitures = await prisma.voiture.findMany({
            where: { proprietaire: proprietaireId }
        });
        if (voitures.length > 0) {
            res.status(200).json(voitures);
        } else {
            res.status(404).send('Aucune voiture trouvée pour ce propriétaire');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des voitures du propriétaire');
    }
});

// GET: Récupérer une voiture spécifique par la plaque d'immatriculation
router.get('/:plaque', authenticateToken, async (req, res) => {
    const { plaque } = req.params;
    try {
        const voiture = await prisma.voiture.findUnique({
            where: { plaqueimat: plaque }
        });
        if (voiture) {
            res.status(200).json(voiture);
        } else {
            res.status(404).send('Voiture non trouvée');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération de la voiture');
    }
});

// POST: Ajouter une nouvelle voiture
router.post('/', authenticateToken, async (req, res) => {
    const { marque, modele, couleur, plaqueimat, proprietaire } = req.body;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(proprietaire) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const nouvelleVoiture = await prisma.voiture.create({
            data: {
                marque,
                modele,
                couleur,
                plaqueimat,
                proprietaire
            }
        });
        res.status(201).json(nouvelleVoiture);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de l\'ajout de la voiture');
    }
});

// Route PUT pour mettre à jour une voiture en fonction de sa plaque d'immatriculation
router.put('/:plaque',verifyTokenAndGetAdminStatus, authenticateToken, async (req, res) => {
    const { marque, modele, couleur, proprietaire } = req.body;
    const { plaque } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(proprietaire) !== userId && !req.userIsAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const voitureUpdated = await prisma.voiture.update({
            where: { plaqueimat: plaque },
            data: {
                marque,
                modele,
                couleur,
                proprietaire
            }
        });
        res.status(200).json(voitureUpdated);
    } catch (err) {
        if (err.code === 'P2025') {
            res.status(404).send('Aucune voiture trouvée avec cette plaque d\'immatriculation');
        } else {
            console.error(err.message);
            res.status(500).send('Erreur lors de la mise à jour de la voiture');
        }
    }
});

// Route DELETE pour supprimer une voiture en fonction de sa plaque d'immatriculation
router.delete('/:plaque',verifyTokenAndGetAdminStatus, authenticateToken, async (req, res) => {
    const { plaque } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(proprietaire) !== userId && !req.userIsAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const deleteResponse = await prisma.voiture.delete({
            where: { plaqueimat: plaque }
        });
        res.status(200).send('Voiture supprimée avec succès');
    } catch (err) {
        if (err.code === 'P2025') {
            res.status(404).send('Aucune voiture trouvée avec cette plaque d\'immatriculation');
        } else {
            console.error(err.message);
            res.status(500).send('Erreur lors de la suppression de la voiture');
        }
    }
});

export default router;
