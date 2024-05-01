import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',    // le nom d'utilisateur pour la base de données
  host: 'localhost',
  database: 'covoiturage',  // le nom de la base de données
  password: 'ProjetWeb',    // votre mot de passe pour la base de données
  port: 5432,              // le port du serveur PostgreSQL
});

export default pool;