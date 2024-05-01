import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import express from 'express';
import reqUtilisateurs from './requete/reqUtilisateurs.js';
import reqVoiture from './requete/reqVoiture.js';
import reqAvis from './requete/reqAvis.js';
import reqMessage from './requete/reqMessage.js';
import reqTrajet from './requete/reqTrajet.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/utilisateurs', reqUtilisateurs);
app.use('/voiture', reqVoiture);
app.use('/avis', reqAvis);
app.use('/message', reqMessage);
app.use('/trajets', reqTrajet);

const port = 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});