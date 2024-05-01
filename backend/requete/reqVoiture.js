import express from 'express';
import pool from './database.js'; // Assurez-vous que le chemin est correct
import { authenticateToken } from './reqUtilisateurs.js';

const router = express.Router();

// GET: Récupérer toutes les voitures
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM voiture;';
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des voitures');
    }
});

// GET: Récupérer une voiture spécifique par la plaque d'immatriculation
router.get('/:plaque', authenticateToken, async (req, res) => {
    const { plaque } = req.params;
    try {
        const query = 'SELECT * FROM voiture WHERE plaqueimat = $1;';
        const result = await pool.query(query, [plaque]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
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
    try {
        const insertQuery = `
            INSERT INTO voiture (marque, modele, couleur, plaqueimat, proprietaire)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [marque, modele, couleur, plaqueimat, proprietaire]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de l\'ajout de la voiture');
    }
});

// Route PUT pour mettre à jour une voiture en fonction de sa plaque d'immatriculation
router.put('/:plaque', authenticateToken, async (req, res) => {
    const { marque, modele, couleur, proprietaire } = req.body;
    const { plaque } = req.params;
    try {
        const updateQuery = `
            UPDATE voiture
            SET marque = $1, modele = $2, couleur = $3, proprietaire = $4
            WHERE plaqueimat = $5
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [marque, modele, couleur, proprietaire, plaque]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).send('Aucune voiture trouvée avec cette plaque d\'immatriculation');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la mise à jour de la voiture');
    }
});

// Route DELETE pour supprimer une voiture en fonction de sa plaque d'immatriculation
router.delete('/:plaque', authenticateToken, async (req, res) => {
    const { plaque } = req.params;
    try {
        const deleteQuery = 'DELETE FROM voiture WHERE plaqueimat = $1;';
        const result = await pool.query(deleteQuery, [plaque]);
        if (result.rowCount > 0) {
            res.status(200).send('Voiture supprimée avec succès');
        } else {
            res.status(404).send('Aucune voiture trouvée avec cette plaque d\'immatriculation');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la suppression de la voiture');
    }
});

export default router;