import express from 'express';
import pool from './database.js'; // Assurez-vous que le chemin est correct
import { authenticateToken } from './reqUtilisateurs.js';

const router = express.Router();

// Routeur GET général pour récupérer tous les messages
router.get('/', authenticateToken, async (req, res) => {
    const selectQuery = 'SELECT * FROM message;';
    try {
        const { rows } = await pool.query(selectQuery);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des messages');
    }
});

// Routeur GET pour récupérer des messages basés sur le destinataire
router.get('/receveur/:receveur', authenticateToken, async (req, res) => {
    const { receveur } = req.params;
    const selectQuery = 'SELECT * FROM message WHERE receveur = $1;';
    try {
        const { rows } = await pool.query(selectQuery, [receveur]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send('Aucun message trouvé pour ce destinataire');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des messages');
    }
});

// Routeur GET pour récupérer des messages basés sur l'émetteur
router.get('/envoyeur/:envoyeur', async (req, res) => {
    const { envoyeur } = req.params;
    const selectQuery = 'SELECT * FROM message WHERE envoyeur = $1;';
    try {
        const { rows } = await pool.query(selectQuery, [envoyeur]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send('Aucun message trouvé pour cet émetteur');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des messages');
    }
});


// Routeur POST pour ajouter un nouveau message
router.post('/', async (req, res) => {
    const { date, texte, envoyeur, receveur } = req.body;
    const insertQuery = `
        INSERT INTO message (date, texte, envoyeur, receveur)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    try {
        const { rows } = await pool.query(insertQuery, [date, texte, envoyeur, receveur]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de l\'ajout du message');
    }
});

// Routeur DELETE pour supprimer un message
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM message WHERE idmessage = $1;';
    try {
        const { rowCount } = await pool.query(deleteQuery, [id]);
        if (rowCount > 0) {
            res.status(200).send('Message supprimé avec succès');
        } else {
            res.status(404).send('Aucun message trouvé avec cet ID');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la suppression du message');
    }
});

export default router;
