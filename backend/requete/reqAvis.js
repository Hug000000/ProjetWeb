import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './reqUtilisateurs.js';
import { verifyTokenAndGetAdminStatus } from './reqUtilisateurs.js';
const prisma = new PrismaClient();
const router = express.Router();

// Routeur GET général pour récupérer tous les avis
router.get('/', authenticateToken, async (req, res) => {
    try {
        const avis = await prisma.avis.findMany();
        res.status(200).json(avis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des avis');
    }
});

// Routeur GET pour récupérer des avis basés sur l'émetteur
router.get('/emetteur/:emetteur', authenticateToken, async (req, res) => {
    const { emetteur } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(emetteur) !== userId && !req.userIsAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const avis = await prisma.avis.findMany({
            where: { emetteur }
        });
        if (avis.length > 0) {
            res.status(200).json(avis);
        } else {
            res.status(404).send('Aucun avis trouvé pour cet émetteur');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des avis');
    }
});

// Routeur GET pour récupérer des avis basés sur le destinataire
router.get('/destinataire/:destinataire', authenticateToken, async (req, res) => {
    const { destinataire } = req.params;
    try {
        const avis = await prisma.avis.findMany({
            where: { destinataire }
        });
        if (avis.length > 0) {
            res.status(200).json(avis);
        } else {
            res.status(404).send('Aucun avis trouvé pour ce destinataire');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des avis');
    }
});

// Routeur GET pour obtenir la moyenne des notes reçues par un utilisateur spécifique
router.get('/moyenne/:destinataire', authenticateToken, async (req, res) => {
    const { destinataire } = req.params;
    try {
        const moyenne = await prisma.avis.aggregate({
            where: { destinataire },
            _avg: {
                note: true
            }
        });
        if (moyenne._avg.note !== null) {
            res.status(200).json({
                utilisateur: destinataire,
                moyenne: parseFloat(moyenne._avg.note).toFixed(2) // Formate la moyenne avec deux décimales
            });
        } else {
            res.status(404).send('Aucune note trouvée pour cet utilisateur ou utilisateur inexistant');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération de la moyenne des notes');
    }
});

// Routeur POST pour ajouter un nouvel avis
router.post('/', authenticateToken, async (req, res) => {
    const { note, date, texte, emetteur, destinataire } = req.body;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(emetteur) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const nouvelAvis = await prisma.avis.create({
            data: {
                note,
                date,
                texte,
                emetteur,
                destinataire
            }
        });
        res.status(201).json(nouvelAvis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de l\'ajout de l\'avis');
    }
});

// Routeur DELETE pour supprimer un avis en fonction de son ID
router.delete('/:id',verifyTokenAndGetAdminStatus, authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(emetteur) !== userId && !req.userIsAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const deleteResult = await prisma.avis.delete({
            where: { idavis: parseInt(id) }
        });
        res.status(200).send('Avis supprimé avec succès');
    } catch (err) {
        if (err.code === 'P2025') {
            res.status(404).send('Aucun avis trouvé avec cet ID');
        } else {
            console.error(err.message);
            res.status(500).send('Erreur lors de la suppression de l\'avis');
        }
    }
});

// Routeur PUT pour mettre à jour un avis en fonction de son ID
router.put('/:id',verifyTokenAndGetAdminStatus, authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { note, date, texte, emetteur, destinataire } = req.body;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(emetteur) !== userId && !req.userIsAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const avisUpdated = await prisma.avis.update({
            where: { idavis: parseInt(id) },
            data: {
                note,
                date,
                texte,
                emetteur,
                destinataire
            }
        });
        res.status(200).json(avisUpdated);
    } catch (err) {
        if (err.code === 'P2025') {
            res.status(404).send('Aucun avis trouvé avec cet ID');
        } else {
            console.error(err.message);
            res.status(500).send('Erreur lors de la mise à jour de l\'avis');
        }
    }
});

export default router;
