import express from 'express';
import pool from './database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const secretKey = 'votre_clé_secrète_ultra_mega_impossible_de_savoir_ce_que_ca_peut_etre';

const router = express.Router();
const saltRounds = 10; // Cout de traitement de hachage

// Routeur POST pour se login à un utilisateur
router.post('/login', async (req, res) => {
    const { username, motdepasse } = req.body;
    if (!username || !motdepasse) {
        return res.status(400).send('Nom d\'utilisateur et mot de passe requis');
    }

    try {
        // Recherchez l'utilisateur dans la base de données en fonction du nom d'utilisateur
        const query = 'SELECT * FROM utilisateurs WHERE username = $1;';
        const { rows } = await pool.query(query, [username]);
        if (rows.length === 0) {
            return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect haha');
        }

        // Comparer le mot de passe hashé dans la base de données avec le mot de passe fourni
        const user = rows[0];
        const motdepasseMatch = await bcrypt.compare(motdepasse, user.motdepasse);
        if (!motdepasseMatch) {
            return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect');
        }

        // Générer un token JWT
        const token = jwt.sign({ userId: user.idutilisateur, username: user.username }, secretKey, { expiresIn: '1h' });

        // Stocker le token dans un cookie
        res.cookie('token', token, { httpOnly: true, secure: true });

        // Renvoyer une réponse réussie
        res.status(200).send('Connexion réussie et token stocké dans un cookie');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la tentative de connexion');
    }
});

// Fonction pour s'authentifier à un utilisateur pour avoir les droits d'agir dessus
export function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Routeur GET pour récuperer tout les utilisateurs
router.get('/', authenticateToken, async (req, res) => {
    const query = 'SELECT * FROM utilisateurs;';
    try {
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des utilisateurs');
    }
});

// Routeur GET pour récuperer l'utilisateur en fonction de l'id
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM utilisateurs WHERE idutilisateur = $1;';
    try {
        const { rows } = await pool.query(query, [id]);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send('Utilisateur non trouvé');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération de l\'utilisateur');
    }
});

// Routeur POST pour créer un utilisateur
router.post('/', async (req, res) => {
    const { nom, prenom, age, username, numtel, photoprofil, securise, motdepasse } = req.body;

    // Vérifier si l'adresse email est déjà utilisée
    try {
        const emailCheckQuery = 'SELECT * FROM utilisateurs WHERE username = $1;';
        const emailCheckResult = await pool.query(emailCheckQuery, [username]);
        if (emailCheckResult.rows.length > 0) {
            return res.status(409).send('L\'adresse email est déjà utilisée par un autre utilisateur.');
        }

        // Insérer le nouvel utilisateur si l'email n'est pas utilisé
        const motdepassehash = await bcrypt.hash(motdepasse, saltRounds);
        const query = `
            INSERT INTO utilisateurs (nom, prenom, age, username, numtel, photoprofil, securise, motdepasse)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [nom, prenom, age, username, numtel, photoprofil, securise, motdepassehash]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la vérification ou de la création de l\'utilisateur');
    }
});

// Routeur DELETE pour supprimer un utilisateur
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'DELETE FROM utilisateurs WHERE idutilisateur = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).send('Utilisateur non trouvé');
        }
        res.status(200).send('Utilisateur supprimé avec succès');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la suppression de l\'utilisateur');
    }
});

// Routeur PUT pour update les informations d'un utilisateur
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, prenom, age, username, numtel, photoprofil, securise, motdepasse } = req.body;
    try {
        const query = `
            UPDATE utilisateurs 
            SET nom = $1, prenom = $2, age = $3, username = $4, numtel = $5, photoprofil = $6, securise = $7, motdepasse = $8
            WHERE idutilisateur = $9
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [nom, prenom, age, username, numtel, photoprofil, securise, motdepasse, id]);
        if (rows.length === 0) {
            return res.status(404).send('Utilisateur non trouvé');
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la mise à jour de l\'utilisateur');
    }
});

export default router;