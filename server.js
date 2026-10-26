import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './src/services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const hasDist = fs.existsSync(distPath);
const oldPagesPath = path.join(__dirname, 'src', 'components', 'old');
const configPath = path.join(__dirname, 'app.config.json');
const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const entryPoint = appConfig.entryPoint === 'old' ? 'old' : 'vue';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/categories', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select Id as id, Categorie as name, Accueil as accueil
       from categories
       order by Categorie`
    );

    const data = Array.isArray(rows) ? rows.map(r => ({ id: r.id, name: r.name, accueil: r.accueil })) : [];
    res.json(data);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/historique', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select h.id, h.annee, h.Description as description, h.spectacle_id,
              s.Nom as spectacle_nom
       from historique h
       left join spectacles s on s.Id = h.spectacle_id
       order by h.annee desc, h.id desc`
    );

    const data = Array.isArray(rows)
      ? rows.map(row => ({
          id: row.id,
          annee: row.annee,
          description: row.description,
          spectacleId: row.spectacle_id,
          spectacleNom: row.spectacle_nom,
        }))
      : [];

    res.json(data);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/spectacles', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select s.Id as id, s.Nom as nom, s.Description as description, s.page, s.annee, c.categorie_id, s.dossier
       from spectacles s
       left join categorisation c on c.spectacle_id = s.Id
       order by s.Nom`
    );

    const data = Array.isArray(rows)
      ? rows.reduce((acc, row) => {
          let spectacle = acc.find(item => item.id === row.id);
          if (!spectacle) {
            spectacle = {
              id: row.id,
              nom: row.nom,
              description: row.description,
              page: row.page,
              annee: row.annee,
              categories: [],
              dossier: row.dossier || null,
            };
            acc.push(spectacle);
          }

          if (row.categorie_id) {
            spectacle.categories.push(row.categorie_id);
          }

          return acc;
        }, [])
      : [];

    res.json(data);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/commentaires', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select c.id, auteur, commentaire, date_commentaire, s.Nom as spectacle_nom, s.page as spectacle_page
       from commentaires c
       left join spectacles s on s.Id = c.spectacle_id
       where c.approuve = 1
       order by c.date_commentaire desc`
    );

    const data = Array.isArray(rows)
      ? rows.reduce((acc, row) => {
          let commentaire = acc.find(item => item.id === row.id);
          if (!commentaire) {
            commentaire = {
              id: row.id,
              auteur: row.auteur,
              commentaire: row.commentaire,
              date: row.date_commentaire,
              spectacle_nom: row.spectacle_nom,
              spectacle_page: row.spectacle_page,
            };
            acc.push(commentaire);
          }

          return acc;
        }, [])
      : [];

    res.json(data);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/commentaires', async (req, res) => {
  const { auteur, email, site, commentaire, spectacle_id } = req.body ?? {};
  const ip = req.ip;

  if (typeof auteur !== 'string' || !auteur.trim() || auteur.trim().length > 100) {
    return res.status(400).json({ error: 'Le nom est obligatoire et ne doit pas dépasser 100 caractères.' });
  }
  if (typeof email !== 'string' || email.length > 100) {
    return res.status(400).json({ error: 'L’adresse email ne doit pas dépasser 100 caractères.' });
  }
  if (typeof site !== 'string' || site.length > 200) {
    return res.status(400).json({ error: 'Le site web ne doit pas dépasser 200 caractères.' });
  }
  if (typeof commentaire !== 'string' || !commentaire.trim()) {
    return res.status(400).json({ error: 'Le commentaire est obligatoire.' });
  }
  if (spectacle_id !== null && spectacle_id !== undefined
      && (!Number.isInteger(Number(spectacle_id)) || Number(spectacle_id) <= 0)) {
    return res.status(400).json({ error: 'Le spectacle sélectionné est invalide.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    let approuve = false;
    const result = await conn.query(
      `insert into commentaires
         (auteur, email_auteur, url_auteur, ip_auteur, date_commentaire, commentaire, spectacle_id, approuve)
       values (?, ?, ?, ?, now(), ?, ?, ?)`,
      [
        auteur.trim(),
        email || null,
        site || null,
        ip,
        commentaire.trim(),
        spectacle_id ? Number(spectacle_id) : null,
        approuve
      ]
    );

    res.status(201).json({ id: Number(result.insertId) });
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'Impossible d’enregistrer le commentaire.' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/client-ip', (req, res) => {
  res.json({ ip: req.ip });
});

app.get('/api/representations', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select s.Id as id, s.Nom as spectacle, s.page, s.annee, r.description as representation, l.id as lieu_id, l.lieu, l.longitude, l.latitude
       from spectacles s
       join representations r on r.spectacle_id = s.Id
       left join lieux l on l.id = r.lieu_id
       order by s.Id`
    );

    let spectacleId = 0;
    const data = Array.isArray(rows)
      ? rows.reduce((acc, row) => {
          let spectacle = acc.find(item => item.id === row.id);
          if (!spectacle && row.id !== spectacleId) {
            spectacle = {
              id: row.id,
              nom: row.spectacle,
              page: row.page,
              annee: row.annee,
              representations: [],
            };
            acc.push(spectacle);
            spectacleId = row.id;
          }

          let representation = {
            description: row.representation,
            lieuId: row.lieu_id,
            lieu: row.lieu,
            longitude: row.longitude,
            latitude: row.latitude,
          };

          if (representation) {
            spectacle.representations.push(representation);
          }

          return acc;
        }, [])
      : [];

    res.json(data);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/spectacles/:slug', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select s.Id as id, s.Nom as nom, coalesce(s.Description, h.Description) as description, s.page, s.annee, c.categorie_id, s.dossier
       from spectacles s
       left join categorisation c on c.spectacle_id = s.Id
       left join historique h on h.spectacle_id = s.Id
       where lower(s.page) = lower(?)`,
      [req.params.slug]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ error: 'spectacle not found' });
      return;
    }

    const spectacle = rows.reduce((acc, row) => {
      if (!acc) {
        acc = {
          id: row.id,
          nom: row.nom,
          description: row.description,
          page: row.page,
          annee: row.annee,
          dossier: row.dossier || null,
          categories: [],
         };
      }

      if (row.categorie_id) {
        acc.categories.push(row.categorie_id);
      }

      return acc;
    }, null);

    res.json(spectacle);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});


app.get('/api/images/:id', async (req, res) => {
  const spectacleId = Number(req.params.id);
  if (!spectacleId) {
    res.status(400).json({ error: 'Invalid spectacle id' });
    return;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select p.Nom as nom, p.Chemin as chemin, i.position, i.spectacle_id from photos p
       join illustrations i on p.id = i.photo_id 
       where i.spectacle_id = ?
       order by i.position`,
       [spectacleId]
    );

    const resultRows = Array.isArray(rows)
      ? rows
      : rows && typeof rows === 'object' && !Array.isArray(rows) && 'nom' in rows
      ? [rows]
      : [];

    const data = resultRows.map(r => ({
      nom: r.nom,
      chemin: r.chemin,
      position: r.position,
      spectacle_id: r.spectacle_id,
    }));

    res.json(data);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

const isProd = process.env.NODE_ENV === 'production';

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

if (entryPoint === 'old') {
  app.use(express.static(oldPagesPath));

  if (isProd || process.env.SERVE_STATIC === 'true' || hasDist) {
    app.use('/old', express.static(distPath));
    app.get(/^\/old(?:\/.*)?$/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
} else if (isProd || process.env.SERVE_STATIC === 'true' || hasDist) {
  app.use('/old', express.static(oldPagesPath));
  app.use(express.static(distPath));

  app.get(/^(?!\/api(?:\/|$)|\/old(?:\/|$)).*$/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.IP || process.env.HOST || '::';

app.listen(PORT, HOST, () => {
  console.log(`API server listening on http://${HOST}:${PORT}`);
});