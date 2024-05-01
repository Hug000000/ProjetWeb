import express from 'express';
import pool from './database.js'; // Assurez-vous que le chemin est correct
import { authenticateToken } from './reqUtilisateurs.js';

const router = express.Router();

// Routeur GET pour récupérer tous les trajets
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM trajet;';
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des trajets');
    }
});

// Routeur GET pour récupérer les trajets où l'utilisateur est conducteur
router.get('/conducteur/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'SELECT * FROM trajet WHERE conducteur = $1;';
        const result = await pool.query(query, [id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des trajets');
    }
});

// Routeur GET pour récupérer les trajets où l'utilisateur est passager
router.get('/passager/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT trajet.*
            FROM trajet
            INNER JOIN estpassager ON trajet.idtrajet = estpassager.trajet
            WHERE estpassager.passager = $1;
        `;
        const result = await pool.query(query, [id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des trajets');
    }
});

// Routeur POST pour ajouter un nouveau trajet
router.post('/', authenticateToken, async (req, res) => {
    const { villedepart, villearrivee, heuredepart, heurearrivee, prix, conducteur } = req.body;
    try {
        const insertQuery = `
            INSERT INTO trajet (villedepart, villearrivee, heuredepart, heurearrivee, prix, conducteur)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [villedepart, villearrivee, heuredepart, heurearrivee, prix, conducteur]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de l\'ajout du trajet');
    }
});

// Routeur PUT pour mettre à jour un trajet en fonction de son identifiant
router.put('/:id', authenticateToken, async (req, res) => {
    const { villedepart, villearrivee, heuredepart, heurearrivee, prix, conducteur } = req.body;
    const { id } = req.params;
    try {
        const updateQuery = `
            UPDATE trajet
            SET villedepart = $1, villearrivee = $2, heuredepart = $3, heurearrivee = $4, prix = $5, conducteur = $6
            WHERE idtrajet = $7
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [villedepart, villearrivee, heuredepart, heurearrivee, prix, conducteur, id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).send('Aucun trajet trouvé avec cet identifiant');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la mise à jour du trajet');
    }
});

// Routeur DELETE pour supprimer un trajet en fonction de son identifiant
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Supprimer d'abord les enregistrements correspondants dans la table estpassager
        const deleteEstPassagerQuery = 'DELETE FROM estpassager WHERE trajet = $1;';
        await pool.query(deleteEstPassagerQuery, [id]);

        // Ensuite, supprimer le trajet de la table trajet
        const deleteTrajetQuery = 'DELETE FROM trajet WHERE idtrajet = $1;';
        const result = await pool.query(deleteTrajetQuery, [id]);
        
        if (result.rowCount > 0) {
            res.status(200).send('Trajet supprimé avec succès');
        } else {
            res.status(404).send('Aucun trajet trouvé avec cet identifiant');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la suppression du trajet');
    }
});

export default router;