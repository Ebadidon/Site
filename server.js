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

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Nom d’utilisateur et mot de passe requis' });
    return;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select id, username, nom, email, administration
       from utilisateurs
       where username = ? and password = ?
       limit 1`,
      [username, password]
    );

    const user = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!user) {
      res.status(401).json({ error: 'Identifiants invalides' });
      return;
    }

    if (user.administration === null || user.administration === undefined || user.administration === '') {
      res.status(403).json({ error: 'Accès refusé : droits d’administration requis' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        nom: user.nom,
        email: user.email,
        administration: user.administration,
      },
    });
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

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
      `select s.Id as id, s.Nom as nom, s.Description as description, s.page, s.annee, c.categorie_id
       from spectacles s
       left join categorisation c on c.spectacle_id = s.Id`
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

app.get('/api/spectacles/:slug', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `select s.Id as id, s.Nom as nom, s.Description as description, s.page, s.annee, c.categorie_id
       from spectacles s
       left join categorisation c on c.spectacle_id = s.Id
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

app.put('/api/spectacles/:id', async (req, res) => {
  const { nom, description, page, annee, categories } = req.body || {};
  const spectacleId = Number(req.params.id);

  if (!spectacleId || !nom || !description || !page) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const selectedCategories = Array.isArray(categories)
    ? categories.map(id => Number(id)).filter(Boolean)
    : [];

  if (selectedCategories.length === 0) {
    res.status(400).json({ error: 'At least one category is required' });
    return;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `update spectacles set Nom = ?, Description = ?, page = ?, annee = ? where Id = ?`,
      [nom, description, page, annee ?? null, spectacleId]
    );

    await conn.query(`delete from categorisation where spectacle_id = ?`, [spectacleId]);

    await Promise.all(
      selectedCategories.map(categoryId =>
        conn.query(
          `insert into categorisation (spectacle_id, categorie_id) values (?, ?)`,
          [spectacleId, categoryId]
        )
      )
    );

    await conn.commit();

    res.json({
      message: 'spectacle updated',
      spectacle: {
        id: spectacleId,
        nom,
        description,
        page,
        annee: annee ?? null,
        categories: selectedCategories,
      },
    });
  } catch (err) {
    if (conn) {
      await conn.rollback().catch(() => {});
    }
    console.error('DB error', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/spectacles', async (req, res) => {
  const { nom, description, page, annee, categories } = req.body || {};

  if (!nom || !description || !page) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const selectedCategories = Array.isArray(categories)
    ? categories.map(id => Number(id)).filter(Boolean)
    : [];

  if (selectedCategories.length === 0) {
    res.status(400).json({ error: 'At least one category is required' });
    return;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const result = await conn.query(
      `insert into spectacles (Nom, Description, page, annee) values (?, ?, ?, ?)
       `,
      [nom, description, page, annee ?? null]
    );

    const spectacleId = result.insertId;

    await Promise.all(
      selectedCategories.map(categoryId =>
        conn.query(
          `insert into categorisation (spectacle_id, categorie_id) values (?, ?)
           `,
          [spectacleId, categoryId]
        )
      )
    );

    await conn.commit();

    res.status(201).json({
      message: 'spectacle created',
      spectacle: {
        nom,
        description,
        page,
        annee: annee ?? null,
        categories: selectedCategories,
      },
    });
  } catch (err) {
    if (conn) {
      await conn.rollback().catch(() => {});
    }
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