<script setup>
import { onMounted, ref } from 'vue'

const emit = defineEmits(['back'])

const imageUrls = import.meta.glob('../assets/images/**/*', {
  eager: true,
  import: 'default',
  query: '?url',
})

const entries = ref([])
const openEntryId = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const appBasePath = window.location.pathname === '/old' || window.location.pathname.startsWith('/old/')
  ? '/old'
  : ''

function getImageUrl(photo) {
  const chemin = String(photo?.chemin || '').replace(/^[/\\]+|[/\\]+$/g, '')
  const nom = String(photo?.nom || '').replace(/^[/\\]+/, '')
  return imageUrls[`../assets/images/${chemin}/${nom}`] || ''
}

async function loadEntryPhotos(entry) {
  if (!entry.spectacleId) return { ...entry, photos: [] }

  const response = await fetch(`/api/images/${entry.spectacleId}`)
  if (!response.ok) return { ...entry, photos: [] }

    const photos = await response.json()
  return {
    ...entry,
      photos: (Array.isArray(photos) ? photos : [])
      .map(photo => ({ ...photo, imageUrl: getImageUrl(photo) }))
      .filter(photo => photo.imageUrl),
  }
}

async function loadHistory() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/api/historique')
    if (!response.ok) {
      throw new Error('Impossible de charger l’historique.')
    }

    const historyEntries = await response.json()
    entries.value = await Promise.all(historyEntries.map(loadEntryPhotos))
    if (entries.value.length > 0) {
      openEntryId.value = entries.value[0].id
    }
  } catch (error) {
    errorMessage.value = error.message || 'Impossible de charger l’historique.'
  } finally {
    loading.value = false
  }
}

function toggleEntry(entryId) {
  openEntryId.value = openEntryId.value === entryId ? null : entryId
}

function getDescriptionParagraphs(description) {
  return String(description || 'Aucune description pour cette année.')
    .split(/\r?\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}

onMounted(loadHistory)
</script>

<template>
  <section class="history-page">
    <button class="back-link" type="button" @click="emit('back')">← Retour à l'accueil</button>

    <header class="history-heading">
      <p class="eyebrow">Mémoire de la compagnie</p>
      <h1>Historique</h1>
      <p>Une histoire de spectacles, de rencontres et de projets au fil des années.</p>
    </header>

    <div v-if="loading" class="state">L’historique se prépare...</div>
    <div v-else-if="errorMessage" class="state error">{{ errorMessage }}</div>
    <div v-else-if="entries.length" class="history-layout">
      <div class="history-intro">
        <p class="intro-label">Une chronologie vivante</p>
        <p>Chaque date raconte une étape de l'aventure. Ouvrez une année pour découvrir son récit et les images des spectacles associés.</p>
      </div>
      <div class="timeline">
      <article
        v-for="entry in entries"
        :key="entry.id"
        class="timeline-entry"
        :class="{ 'is-open': openEntryId === entry.id }"
      >
        <div class="timeline-marker" aria-hidden="true"></div>
        <button
          class="year-button"
          type="button"
          :aria-expanded="openEntryId === entry.id"
          :aria-controls="`history-entry-${entry.id}`"
          @click="toggleEntry(entry.id)"
        >
          <span>{{ entry.annee }}</span>
          <span class="toggle-icon" aria-hidden="true">{{ openEntryId === entry.id ? '−' : '+' }}</span>
        </button>
        <div v-if="openEntryId === entry.id" :id="`history-entry-${entry.id}`" class="entry-content">
          <p v-if="entry.spectacleNom" class="entry-title">{{ entry.spectacleNom }}</p>
          <p v-for="(paragraph, paragraphIndex) in getDescriptionParagraphs(entry.description)" :key="paragraphIndex">
            {{ paragraph }}
          </p>
          <div v-if="entry.photos.length" class="entry-photos">
            <a
              v-for="(photo, photoIndex) in entry.photos"
              :key="`${entry.id}-${photo.nom}-${photoIndex}`"
              class="history-photo"
              :href="photo.imageUrl"
              target="_blank"
              rel="noreferrer"
            >
              <img :src="photo.imageUrl" :alt="entry.spectacleNom || `Photo de ${entry.annee}`" loading="lazy" />
            </a>
          </div>
          <a
            v-if="entry.photos.length && entry.spectacleId"
            class="gallery-link"
            :href="`${appBasePath}/galerie?spectacle=${encodeURIComponent(entry.spectacleId)}`"
          >
            Voir les photos de ce spectacle dans la galerie →
          </a>
        </div>
      </article>
      </div>
    </div>
    <div v-else class="state">Aucun événement historique trouvé.</div>
  </section>
</template>

<style scoped>
.history-page {
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

.history-heading {
  max-width: 700px;
  margin: 4rem 0 5rem;
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

.timeline {
  position: relative;
  padding-left: 7rem;
}

.history-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.3fr);
  gap: clamp(2rem, 8vw, 8rem);
  align-items: start;
}

.history-intro {
  position: sticky;
  top: 2rem;
  max-width: 22rem;
  padding-top: 0.75rem;
}

.intro-label {
  color: #d06b47;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.timeline::before {
  position: absolute;
  top: 0.75rem;
  bottom: 0.75rem;
  left: 2.35rem;
  width: 1px;
  background: var(--color-border);
  content: '';
}

.timeline-entry {
  position: relative;
  padding-bottom: 2rem;
}

.timeline-marker {
  position: absolute;
  top: 0.9rem;
  left: -4.82rem;
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid var(--color-heading);
  border-radius: 50%;
  background: var(--color-background);
  transition: background 0.2s ease, transform 0.2s ease;
}

.is-open .timeline-marker {
  background: #d06b47;
  transform: scale(1.35);
}

.year-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: none;
  color: var(--color-heading);
  cursor: pointer;
  font: inherit;
  font-size: 1.65rem;
  font-weight: 700;
  padding: 0.35rem 0;
  text-align: left;
}

.toggle-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  font-size: 1.35rem;
  font-weight: 400;
}

.entry-content {
  max-width: 720px;
  padding: 0.75rem 3rem 0.5rem 0;
  animation: reveal 0.25s ease-out;
}

.entry-title {
  color: #d06b47;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.entry-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.history-photo {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 4px;
  background: var(--color-background-soft);
}

.history-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.history-photo:hover img {
  transform: scale(1.05);
}

.gallery-link {
  display: inline-block;
  color: var(--color-heading);
  font-weight: 700;
  margin-top: 1rem;
}

.state {
  padding: 2rem 0;
}

.error {
  color: #b91c1c;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(-0.4rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .history-heading {
    margin: 3rem 0;
  }

  .timeline {
    padding-left: 3.25rem;
  }

  .history-layout {
    display: block;
  }

  .history-intro {
    position: static;
    margin-bottom: 2rem;
  }

  .timeline::before {
    left: 0.35rem;
  }

  .timeline-marker {
    left: -3.27rem;
  }

  .year-button {
    font-size: 1.35rem;
  }

  .entry-photos {
    display: block;
  }

  .history-photo:not(:first-child) {
    display: none;
  }
}
</style>