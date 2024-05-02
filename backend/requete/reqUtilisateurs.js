import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const secretKey = process.env.SECRET_KEY;
router.use(verifyTokenAndGetAdminStatus);
const router = express.Router();
const saltRounds = 10; // Coût de traitement de hachage

// Routeur POST pour se connecter à un utilisateur
router.post('/login', async (req, res) => {
    const { username, motdepasse } = req.body;
    if (!username || !motdepasse) {
        return res.status(400).send('Nom d\'utilisateur et mot de passe requis');
    }

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect');
        }

        const motdepasseMatch = await bcrypt.compare(motdepasse, user.motdepasse);
        if (!motdepasseMatch) {
            return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect');
        }

        const token = jwt.sign({ userId: user.idutilisateur }, secretKey, { expiresIn: '1h' });

        res.cookie('token', token, { httpOnly: true, secure: true });
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
        req.decoded = user; //je récupère les données stockés dans le token pour les analyser plus tard
        next();
    });
}

// Middleware pour extraire et vérifier le token JWT du cookie
export const verifyTokenAndGetAdminStatus = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Token absent, authentification requise');
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        const user = await prisma.utilisateur.findUnique({
            where: { idutilisateur: decoded.userId },
            select: { estadmin: true }
        });
        if (!user) {
            return res.status(404).send('Utilisateur non trouvé');
        }
        req.userIsAdmin = user.estadmin;
        next();
    } catch (err) {
        console.error(err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).send('Token invalide');
        }
        res.status(500).send('Erreur serveur lors de la vérification du token');
    }
};

// Routeur GET pour récupérer tous les utilisateurs avec leurs photos
router.get('/', authenticateToken, async (req, res) => {
    try {
        const usersWithPhotos = await prisma.utilisateur.findMany({
            include: {
                photo: {
                    select: {
                        image: true
                    }
                }
            }
        });
        res.status(200).json(usersWithPhotos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des utilisateurs');
    }
});

// Routeur GET pour récupérer toutes les informations de l'utilisateur, à l'exception du mot de passe
router.get('/:id/informations', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.utilisateur.findUnique({
            where: { idutilisateur: parseInt(id) },
            include: {
                photo: {
                    select: { image: true }
                }
            },
            select: {
                idutilisateur: true,
                nom: true,
                prenom: true,
                age: true,
                username: true,
                numtel: true,
                photo: {
                    select: { image: true }
                },
                estadmin: true
            }
        });

        if (!user) {
            return res.status(404).send('Utilisateur non trouvé');
        }
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des informations de l\'utilisateur');
    }
});

// Routeur GET pour récupérer toutes les informations de l'utilisateur, y compris le mot de passe, avec vérification de l'identifiant d'utilisateur dans le token JWT
router.get('/:id/informationsWithPassword', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(id) !== userId) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const user = await prisma.utilisateur.findUnique({
            where: { idutilisateur: parseInt(id) },
            include: {
                photo: {
                    select: { image: true }
                }
            }
        });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).send('Utilisateur non trouvé');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la récupération des informations de l\'utilisateur');
    }
});

// Routeur PUT pour mettre à jour les informations d'un utilisateur et l'image dans la table Photo
router.put('/:id', authenticateToken, verifyTokenAndGetAdminStatus, async (req, res) => {
    const { id } = req.params;
    const { nom, prenom, age, username, numtel, photoimage, motdepasse } = req.body;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(id) !== userId && !req.userIsAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        // Récupérer l'utilisateur pour obtenir l'ID de la photo associée
        const user = await prisma.utilisateur.findUnique({
            where: { idutilisateur: parseInt(id) },
            include: {
                photo: {
                    select: {
                        idphoto: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).send('Utilisateur non trouvé');
        }
        // Récupérer l'ID de la photo associée à l'utilisateur
        const photoId = user.photo ? user.photo.idphoto : null;
        // Mettre à jour l'image de la photo associée à l'utilisateur
        const updatedPhoto = await prisma.photo.update({
            where: { idphoto: photoId },
            data: {
                image: photoimage
            }
        });
        // Mettre à jour les informations de l'utilisateur sauf photoprofil
        const updatedUser = await prisma.utilisateur.update({
            where: { idutilisateur: parseInt(id) },
            data: {
                nom,
                prenom,
                age,
                username,
                numtel,
                motdepasse,
                estadmin: false // Initialisation de estadmin à false
            }
        });
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la mise à jour de l\'utilisateur et de l\'image');
    }
});

// Routeur DELETE pour supprimer un utilisateur
router.delete('/:id', authenticateToken, verifyTokenAndGetAdminStatus, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.decoded; // Identifiant d'utilisateur extrait du token JWT
    if (parseInt(id) !== userId && !req.userIsAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        // Récupération de l'utilisateur pour obtenir l'ID de la photo associée
        const user = await prisma.utilisateur.findUnique({
            where: { idutilisateur: parseInt(id) },
            include: {
                photo: {
                    select: {
                        idphoto: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).send('Utilisateur non trouvé');
        }
        // Suppression de l'utilisateur
        await prisma.utilisateur.delete({
            where: { idutilisateur: parseInt(id) }
        });
        // Si l'utilisateur a une photo associée, supprime également la photo
        if (user.photo) {
            await prisma.photo.delete({
                where: { idphoto: user.photo.idphoto }
            });
        }
        res.status(200).send('Utilisateur supprimé avec succès');
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).send('Utilisateur non trouvé');
        }
        console.error(err.message);
        res.status(500).send('Erreur lors de la suppression de l\'utilisateur');
    }
});

// Route GET pour récupérer la valeur de estadmin en utilisant le middleware
router.get('/my-admin-status', verifyTokenAndGetAdminStatus, (req, res) => {
    res.status(200).send({ estadmin: req.userIsAdmin });
});

// Routeur PUT pour mettre à jour estadmin pour un utilisateur spécifique
router.put('/:id/estadmin', async (req, res) => {
    const { id } = req.params;
    const { estadmin } = req.body;
    const { tokenadmin } = req.userIsAdmin;
    if (!tokenadmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const updatedUser = await prisma.utilisateur.update({
            where: { idutilisateur: parseInt(id) },
            data: {
                estadmin
            }
        });
        if (updatedUser) {
            res.status(200).json(updatedUser);
        } else {
            res.status(404).send('Utilisateur non trouvé');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur lors de la mise à jour de estadmin pour l\'utilisateur');
    }
});

export default router;