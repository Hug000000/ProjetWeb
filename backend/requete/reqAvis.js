import express from 'express';
import pool from './database.js'; // Assurez-vous que le chemin est correct
import { authenticateToken } from './reqUtilisateurs.js';

const router = express.Router();

// Routeur GET général pour récupérer tous les avis
router.get('/', authenticateToken, async (req, res) => {
    const selectQuery = 'SELECT * FROM avis;';
    try {
        const { rows } = await pool.query(selectQuery);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des avis');
    }
});

// Routeur GET pour récupérer des avis basés sur l'émetteur
router.get('/emetteur/:envoyeur', authenticateToken, async (req, res) => {
    const { envoyeur } = req.params;
    const selectQuery = 'SELECT * FROM avis WHERE envoyeur = $1;';
    try {
        const { rows } = await pool.query(selectQuery, [envoyeur]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send('Aucun avis trouvé pour cet émetteur');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des avis');
    }
});

// Routeur GET pour récupérer des avis basés sur le destinataire
router.get('/destinataire/:receveur', authenticateToken, async (req, res) => {
    const { receveur } = req.params;
    const selectQuery = 'SELECT * FROM avis WHERE receveur = $1;';
    try {
        const { rows } = await pool.query(selectQuery, [receveur]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send('Aucun avis trouvé pour ce destinataire');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des avis');
    }
});

// Routeur GET pour obtenir la moyenne des notes reçues par un utilisateur spécifique
router.get('/moyenne/:receveur', async (req, res) => {
    const { receveur } = req.params;
    const avgQuery = `
        SELECT AVG(note) as moyenne
        FROM avis
        WHERE receveur = $1;
    `;
    try {
        const { rows } = await pool.query(avgQuery, [receveur]);
        if (rows[0].moyenne) {
            res.status(200).json({
                utilisateur: receveur,
                moyenne: parseFloat(rows[0].moyenne).toFixed(2) // Formate la moyenne avec deux décimales
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
    const { note, date, texte, envoyeur, receveur } = req.body;
    const insertQuery = `
        INSERT INTO avis (note, date, texte, envoyeur, receveur)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    try {
        const { rows } = await pool.query(insertQuery, [note, date, texte, envoyeur, receveur]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de l\'ajout de l\'avis');
    }
});

// Routeur DELETE pour supprimer un avis en fonction de son ID
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM avis WHERE idavis = $1;';
    try {
        const { rowCount } = await pool.query(deleteQuery, [id]);
        if (rowCount > 0) {
            res.status(200).send('Avis supprimé avec succès');
        } else {
            res.status(404).send('Aucun avis trouvé avec cet ID');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la suppression de l\'avis');
    }
});

// Routeur PUT pour mettre à jour un avis en fonction de son ID
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { note, date, texte, envoyeur, receveur } = req.body;
    const updateQuery = `
        UPDATE avis
        SET note = $1, date = $2, texte = $3, envoyeur = $4, receveur = $5
        WHERE idavis = $6
        RETURNING *;
    `;
    try {
        const { rows } = await pool.query(updateQuery, [note, date, texte, envoyeur, receveur, id]);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send('Aucun avis trouvé avec cet ID');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la mise à jour de l\'avis');
    }
});

export default router;