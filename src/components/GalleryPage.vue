<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits(['back'])

const imageUrls = import.meta.glob('../assets/images/**/*', {
  eager: true,
  import: 'default',
  query: '?url',
})

const photos = ref([])
const spectacles = ref([])
const selectedSpectacle = ref('all')
const searchQuery = ref('')
const selectedPhoto = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const touchStartX = ref(null)

function getImageUrl(photo) {
  const chemin = String(photo?.chemin || '').replace(/^[/\\]+|[/\\]+$/g, '')
  const nom = String(photo?.nom || '').replace(/^[/\\]+/, '')
  return imageUrls[`../assets/images/${chemin}/${nom}`] || ''
}

const filteredPhotos = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()

  return photos.value.filter((photo) => {
    const matchesSpectacle = selectedSpectacle.value === 'all'
      || String(photo.spectacleId) === selectedSpectacle.value
    const matchesSearch = !query
      || `${photo.nom} ${photo.spectacleNom}`.toLocaleLowerCase().includes(query)

    return matchesSpectacle && matchesSearch
  })
})

async function loadGallery() {
  loading.value = true
  errorMessage.value = ''

  try {
    const spectaclesResponse = await fetch('/api/spectacles')
    if (!spectaclesResponse.ok) {
      throw new Error('Impossible de charger les spectacles.')
    }

    spectacles.value = await spectaclesResponse.json()
    const requestedSpectacle = new URLSearchParams(window.location.search).get('spectacle')
    selectedSpectacle.value = spectacles.value.some(spectacle => String(spectacle.id) === requestedSpectacle)
      ? requestedSpectacle
      : 'all'

    const photoGroups = await Promise.all(
      spectacles.value.map(async (spectacle) => {
        const response = await fetch(`/api/images/${spectacle.id}`)
        if (!response.ok) return []

        const spectaclePhotos = await response.json()
        return spectaclePhotos.map((photo) => ({
          ...photo,
          imageUrl: getImageUrl(photo),
          spectacleId: spectacle.id,
          spectacleNom: spectacle.nom,
        }))
      }),
    )

    photos.value = photoGroups.flat().filter((photo) => photo.imageUrl)
  } catch (error) {
    errorMessage.value = error.message || 'Impossible de charger la galerie.'
  } finally {
    loading.value = false
  }
}

function openPhoto(photo) {
  selectedPhoto.value = photo
}

function closePhoto() {
  selectedPhoto.value = null
}

function showAdjacentPhoto(direction) {
  const currentIndex = filteredPhotos.value.findIndex((photo) => photo === selectedPhoto.value)
  if (currentIndex === -1 || filteredPhotos.value.length < 2) return

  const nextIndex = (currentIndex + direction + filteredPhotos.value.length)
    % filteredPhotos.value.length
  selectedPhoto.value = filteredPhotos.value[nextIndex]
}

function handleTouchStart(event) {
  touchStartX.value = event.changedTouches[0]?.clientX ?? null
}

function handleTouchEnd(event) {
  if (touchStartX.value === null) return

  const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.value
  const distance = touchEndX - touchStartX.value
  touchStartX.value = null

  if (Math.abs(distance) < 50) return
  showAdjacentPhoto(distance < 0 ? 1 : -1)
}

function handleKeydown(event) {
  if (event.key === 'Escape') closePhoto()
  if (event.key === 'ArrowRight') showAdjacentPhoto(1)
  if (event.key === 'ArrowLeft') showAdjacentPhoto(-1)
}

onMounted(() => {
  loadGallery()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <section class="gallery-page">
    <div class="page-heading">
      <div>
        <button class="back-link" type="button" @click="emit('back')">← Retour à l'accueil</button>
        <p class="eyebrow">Archives visuelles</p>
        <h1>La galerie</h1>
      </div>
      <p class="photo-count">{{ filteredPhotos.length }} photo{{ filteredPhotos.length > 1 ? 's' : '' }}</p>
    </div>

    <div class="filters" aria-label="Filtres de la galerie">
      <label>
        <span>Rechercher</span>
        <input v-model="searchQuery" type="search" placeholder="Un spectacle, une image..." />
      </label>
      <label>
        <span>Spectacle</span>
        <select v-model="selectedSpectacle">
          <option value="all">Tous les spectacles</option>
          <option v-for="spectacle in spectacles" :key="spectacle.id" :value="String(spectacle.id)">
            {{ spectacle.nom }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="state">La galerie se prépare...</div>
    <div v-else-if="errorMessage" class="state error">{{ errorMessage }}</div>
    <div v-else-if="filteredPhotos.length" class="gallery-grid">
      <button
        v-for="photo in filteredPhotos"
        :key="`${photo.spectacleId}-${photo.nom}-${photo.position}`"
        class="photo-card"
        type="button"
        @click="openPhoto(photo)"
      >
        <img :src="photo.imageUrl" :alt="`${photo.spectacleNom}`" loading="lazy" />
        <span class="photo-caption">
          <strong>{{ photo.spectacleNom }}</strong>
         </span>
      </button>
    </div>
    <div v-else class="state">Aucune photo ne correspond à votre recherche.</div>

    <div
      v-if="selectedPhoto"
      class="lightbox"
      role="dialog"
      aria-modal="true"
      @click.self="closePhoto"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <button class="close-button" type="button" aria-label="Fermer la photo" @click="closePhoto">×</button>
      <button
        class="navigation-button previous-button"
        type="button"
        aria-label="Photo précédente"
        @click="showAdjacentPhoto(-1)"
      >
        ‹
      </button>
      <img :src="selectedPhoto.imageUrl" :alt="selectedPhoto.spectacleNom" />
      <button
        class="navigation-button next-button"
        type="button"
        aria-label="Photo suivante"
        @click="showAdjacentPhoto(1)"
      >
        ›
      </button>
      <p>{{ selectedPhoto.spectacleNom }}</p>
    </div>
  </section>
</template>

<style scoped>
.gallery-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 2rem clamp(1rem, 5vw, 5rem) 4rem;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: end;
  margin-bottom: 2rem;
}

.back-link {
  border: 0;
  background: none;
  color: var(--color-heading);
  cursor: pointer;
  font: inherit;
  padding: 0;
}

.eyebrow {
  color: #d06b47;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 2rem 0 0.5rem;
  text-transform: uppercase;
}

h1 {
  color: var(--color-heading);
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  line-height: 0.95;
  margin: 0;
}

.intro {
  max-width: 36rem;
  margin-bottom: 0;
}

.photo-count {
  color: var(--color-heading);
  font-weight: 700;
  white-space: nowrap;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

label {
  display: grid;
  gap: 0.35rem;
  flex: 1;
}

label span {
  color: var(--color-heading);
  font-size: 0.8rem;
  font-weight: 700;
}

input,
select {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
  padding: 0.7rem 0.8rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.photo-card {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  background: #1e2522;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.photo-card:hover img,
.photo-card:focus-visible img {
  transform: scale(1.05);
}

.photo-caption {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 0.2rem;
  padding: 2.5rem 0.85rem 0.75rem;
  background: linear-gradient(transparent, rgba(15, 21, 19, 0.9));
  color: white;
}

.photo-caption small {
  overflow: hidden;
  opacity: 0.75;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state {
  padding: 2rem 0;
}

.error {
  color: #b91c1c;
}

.lightbox {
  position: fixed;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 3rem;
  background: rgba(13, 18, 16, 0.92);
}

.lightbox img {
  max-width: min(1100px, 90vw);
  max-height: 78vh;
  object-fit: contain;
}

.lightbox p {
  color: white;
  margin: 0;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  border: 0;
  background: none;
  color: white;
  cursor: pointer;
  font-size: 2.5rem;
  line-height: 1;
}

.navigation-button {
  position: absolute;
  top: 50%;
  display: grid;
  width: 3rem;
  height: 4rem;
  place-items: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  color: white;
  cursor: pointer;
  font-size: 3rem;
  line-height: 1;
  transition: background 0.2s ease;
}

.navigation-button:hover,
.navigation-button:focus-visible {
  background: rgba(255, 255, 255, 0.28);
}

.previous-button {
  left: 1.5rem;
}

.next-button {
  right: 1.5rem;
}

@media (max-width: 640px) {
  .page-heading,
  .filters {
    align-items: stretch;
    flex-direction: column;
  }

  .photo-count {
    margin: 0;
  }

  .navigation-button {
    display: none;
  }

  .lightbox {
    padding: 3rem 1rem 2rem;
    touch-action: pan-y;
  }
}
</style>