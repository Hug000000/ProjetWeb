import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express from 'express';
import reqUtilisateurs from './requete/reqUtilisateurs.js';
import reqVoiture from './requete/reqVoiture.js';
import reqAvis from './requete/reqAvis.js';
import reqMessage from './requete/reqMessage.js';
import reqTrajet from './requete/reqTrajet.js';
import reqVille from './requete/reqVille.js';
import cors from 'cors';
import 'dotenv/config';

// Configurer CORS avec des options personnalisées
const corsOptions = {
  origin: process.env.FRONT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use('/utilisateurs', reqUtilisateurs);
app.use('/voiture', reqVoiture);
app.use('/avis', reqAvis);
app.use('/message', reqMessage);
app.use('/trajets', reqTrajet);
app.use('/ville', reqVille);

console.log('CORS middleware configuré');
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});