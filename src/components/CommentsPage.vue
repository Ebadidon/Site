<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
// Polices manuscrites hébergées avec le site :
// npm install @fontsource/caveat @fontsource/kalam @fontsource/reenie-beanie @fontsource/shadows-into-light @fontsource/patrick-hand
import '@fontsource/caveat/400.css'
import '@fontsource/caveat/700.css'
import '@fontsource/kalam/400.css'
import '@fontsource/kalam/700.css'
import '@fontsource/reenie-beanie/400.css'
import '@fontsource/shadows-into-light/400.css'
import '@fontsource/patrick-hand/400.css'

const emit = defineEmits(['back'])

const comments = ref([])
const loading = ref(true)
const errorMessage = ref('')
const newComment = ref('')
const auteur = ref('')
const email = ref('')
const site = ref('')
const spectacle = ref('')
const commente = ref(false)
const spectacles = ref([])
const submitError = ref('')
const submitSuccess = ref('')
const submitting = ref(false)
let submitSuccessTimer
const appBasePath = window.location.pathname === '/old' || window.location.pathname.startsWith('/old/')
  ? '/old'
  : ''

async function loadComments() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/api/commentaires')
    if (!response.ok) {
      throw new Error('Impossible de charger les commentaires.')
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error('Les commentaires reçus sont invalides.')
    }

    comments.value = data

    const response_spectacles = await fetch('/api/spectacles')
    if (!response_spectacles.ok) {
      throw new Error('Impossible de charger les spectacles.')
    }

    const spectaclesData = await response_spectacles.json()
    if (!Array.isArray(spectaclesData)) {
      throw new Error('Les spectacles reçus sont invalides.')
    }

    spectacles.value = spectaclesData
  } catch (error) {
    errorMessage.value = error.message || 'Impossible de charger les commentaires.'
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  if (!date) return ''

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return String(date)

  return "Le " + new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(parsedDate).replace(':', 'h')
}

// Aspect des papiers : calculé à partir de l'identifiant, donc stable
// d'un affichage à l'autre (pas de hasard à chaque rendu).
const papers = ['#fffef7', '#fff6bf', '#fbe3dc', '#e3efe0', '#e1ecf7']

// Chaque police a sa taille (leurs hauteurs de lettres diffèrent beaucoup)
// et un poids de signature : 700 seulement si la police existe en gras.
const secours = "'Segoe Print', 'Bradley Hand', cursive"
const fonts = [
  { family: `'Caveat', ${secours}`, size: '1.45rem', sign: 700 },
  { family: `'Kalam', ${secours}`, size: '1.1rem', sign: 700 },
  { family: `'Reenie Beanie', ${secours}`, size: '1.75rem', sign: 400 },
  { family: `'Shadows Into Light', ${secours}`, size: '1.3rem', sign: 400 },
  { family: `'Patrick Hand', ${secours}`, size: '1.25rem', sign: 400 },
]

// Petit mélange des bits : évite que la police suive le même cycle que la couleur
function fontFor(n) {
  return fonts[(Math.imul(n + 1, 2654435761) >>> 16) % fonts.length]
}

function noteStyle(id) {
  const n = Math.abs(Number(id) || 0)
  const font = fontFor(n)
  return {
    '--tilt': `${(((n * 37) % 61) / 10 - 3).toFixed(1)}deg`,
    '--tape-tilt': `${(((n * 53) % 90) / 10 - 4.5).toFixed(1)}deg`,
    '--paper': papers[(n * 7) % papers.length],
    '--note-font': font.family,
    '--note-size': font.size,
    '--sign-weight': font.sign,
  }
}

function noteClass(id) {
  const n = Math.abs(Number(id) || 0)
  return {
    ruled: n % 2 === 0, // certains papiers sont lignés, d'autres unis
    taped: n % 3 !== 0, // certains sont scotchés, d'autres simplement posés
  }
}

async function submitComment() {
  submitError.value = ''
  submitting.value = true

  try {
    const commentData = {
      auteur: auteur.value,
      email: email.value,
      site: site.value,
      commentaire: newComment.value,
      spectacle_id: parseInt(spectacle.value) || null,
    }

    const response = await fetch('/api/commentaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    })
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Impossible d’enregistrer le commentaire.')
    }

    newComment.value = ''
    auteur.value = ''
    email.value = ''
    site.value = ''
    spectacle.value = ''
    commente.value = false
    submitSuccess.value = 'Votre commentaire a bien été enregistré. Il n’apparaîtra toutefois sur notre site qu’après que nous l’aurons validé. Nous sommes désolés de ce contretemps, mais cette étape est rendue obligatoire par la mauvaise habitude qu’ont certains de répandre sur le web des messages indésirables.'
    clearTimeout(submitSuccessTimer)
    submitSuccessTimer = setTimeout(() => {
      submitSuccess.value = ''
    }, 30_000)
  } catch (error) {
    submitError.value = error.message || 'Impossible d’enregistrer le commentaire.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadComments)
onUnmounted(() => clearTimeout(submitSuccessTimer))
</script>

<template>
  <section class="comments-page">
    <button class="back-link" type="button" @click="emit('back')">← Retour à l'accueil</button>

    <header class="comments-heading">
      <p class="eyebrow">Vos mots, notre histoire</p>
      <h1>Commentaires</h1>
      <p>Les messages laissés par celles et ceux qui ont partagé un moment avec la compagnie.</p>
    </header>

    <section v-if="commente" class="commentaire">
    <form @submit.prevent="submitComment" style="margin:auto ; width: 80%;">
      <div><label for="auteur">Votre nom</label></div>
      <div><input id="auteur" v-model="auteur" type="text" required /></div>
      <div><label for="email">Votre adresse email</label></div>
      <div><input id="email" v-model="email" type="email"  required /></div>
      <div><label for="site">Votre site web (optionnel)</label></div>
      <div><input id="site" v-model="site" type="url"  /></div>
      <div><label for="commentaire">Votre commentaire</label></div>
      <div><textarea id="commentaire" v-model="newComment" required style="width: 60%; height: 200px;"></textarea></div>
      <div><label for="spectacle">Le spectacle (optionnel)</label></div>
      <div>
        <select id="spectacle" v-model="spectacle">
          <option value="">Sélectionnez un spectacle</option>
          <option v-for="spectacle in spectacles" :key="spectacle.id" :value="spectacle.id">
            {{ spectacle.nom }}
          </option>
        </select> 
      </div>
      <p v-if="submitError" class="state error" role="alert">{{ submitError }}</p>
      <div><button type="submit" style="margin-top:15px" class="dark-red-button" :disabled="submitting">Envoyer</button></div>
    </form>
    </section>
    <p v-else-if="submitSuccess" class="posted" role="status">{{ submitSuccess }}</p>
    <section v-else class="commentaire">
      <button class="dark-red-button" type="button" @click="commente = true">Écrire un témoignage</button>
    </section>

    <div v-if="loading" class="state">Les commentaires se préparent...</div>
    <div v-else-if="errorMessage" class="state error">{{ errorMessage }}</div>
    <div v-else-if="comments.length" class="comments-list">
      <article
        v-for="comment in comments"
        :key="comment.id"
        class="comment-card"
        :class="noteClass(comment.id)"
        :style="noteStyle(comment.id)"
      >
        <p class="comment-text">{{ comment.commentaire }}</p>
        <footer class="comment-heading">
          <h2>{{ comment.auteur || 'Anonyme' }}</h2>
          <time v-if="comment.date" :datetime="comment.date">{{ formatDate(comment.date) }}</time>
        </footer>
        <div v-if="comment.spectacle_nom" style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--ink-soft);">
          <a :href="`${appBasePath}/?spectacle=${encodeURIComponent(comment.spectacle_page)}`">{{ comment.spectacle_nom }}</a>
        </div>
      </article>
    </div>
    <div v-else class="state">Aucun commentaire pour le moment.</div>
  </section>
</template>

<style scoped>
.comments-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 2rem clamp(1rem, 5vw, 5rem) 5rem;
}

.back-link {
  border: 0;
  background: none;
  color: var(--color-heading);
  cursor: pointer;
  font: inherit;
  padding: 0;
}

.comments-heading {
  max-width: 700px;
  margin: 4rem 0 3rem;
}

.eyebrow {
  color: #d06b47;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

h1 {
  color: var(--color-heading);
  font-size: clamp(2.8rem, 8vw, 6rem);
  line-height: 0.95;
  margin-bottom: 1rem;
}

/* Petits papiers posés sur la page */
.comments-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 20rem));
  justify-content: space-evenly;
  gap: 2.25rem 1.75rem;
  align-items: start;
  padding: 1rem 0.5rem;
}

.comment-card {
  --ink: #27356b;
  --ink-soft: #4a5784;
  --line: 2rem;
  position: relative;
  padding: 1.6rem 1.4rem 1.2rem;
  border-radius: 2px 2px 3px 2px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(0, 0, 0, 0.03)),
    var(--paper, #fffef7);
  box-shadow:
    0 1px 1px rgba(40, 30, 10, 0.18),
    0 10px 16px -10px rgba(40, 30, 10, 0.45);
  color: var(--ink);
  font-synthesis: none;
  transform: rotate(var(--tilt, 0deg));
}

/* Morceau de ruban adhésif */
.comment-card.taped::before {
  content: '';
  position: absolute;
  top: -0.7rem;
  left: 50%;
  width: 5.5rem;
  height: 1.5rem;
  background: rgba(222, 205, 150, 0.6);
  box-shadow: 0 1px 2px rgba(40, 30, 10, 0.15);
  transform: translateX(-50%) rotate(var(--tape-tilt, 0deg));
}

.comment-text {
  margin: 0;
  font-family: var(--note-font);
  font-size: var(--note-size);
  line-height: var(--line);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* Lignes du papier : même pas que l'interligne, le texte reste posé dessus */
.comment-card.ruled .comment-text {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(var(--line) - 1px),
    rgba(70, 110, 170, 0.3) calc(var(--line) - 1px),
    rgba(70, 110, 170, 0.3) var(--line)
  );
}

/* Signature en bas à droite, comme au bas d'un mot */
.comment-heading {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: 1rem;
  text-align: right;
  font-family: var(--note-font);
  font-size: var(--note-size);
}

.comment-heading h2 {
  margin: 0;
  color: var(--ink);
  font-family: inherit;
  font-size: 1.1em;
  font-weight: var(--sign-weight);
  line-height: 1.2;
  transform: rotate(-1.5deg);
}

.comment-heading time {
  color: var(--ink-soft);
  font-size: 0.8em;
}

.state {
  padding: 2rem 0;
  color: #666;
}

.error {
  color: #a33;
}

.dark-red-button 
{
  padding:7px 10px;
  background:#870000;
  background:-webkit-linear-gradient(#C50000,#870000);
  background:-o-linear-gradient(#C50000,#870000);
  background:-moz-linear-gradient(#C50000,#870000);
  background:linear-gradient(#C50000,#870000);
  border:1px solid #870000;;
  border-radius:6px;
  box-shadow:2px 2px 3px #222;
  color:white;
  font-size:16px;
  margin-bottom:15px;
}
  
input[type="text"] {
  width:300px;
  padding:5px;
  border:1px solid rgb(47, 47, 47);
}

.posted {
  display: block;
  padding: 2rem;
  color: green;
  font-weight: bold;
  font-size: larger;
  max-width: 600px;
  border: 1px solid green;
  border-radius: 5px;
  margin: 2rem auto;
  text-align: center;
}

</style>