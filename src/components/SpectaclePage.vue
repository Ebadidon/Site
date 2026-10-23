<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  slug: {
    type: String,
    default: '',
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['back', 'edit'])

const spectacle = ref(null)
const loading = ref(false)
const errorMessage = ref('')

function formatDescription(description) {
  if (!description) return []

  return String(description)
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
}

function getImageUrl(photo) {
  if (!photo?.chemin || !photo?.nom) {
    return ''
  }

  const chemin = String(photo.chemin).replace(/^[/\\]+|[/\\]+$/g, '').replace(/\\/g, '/')
  const nom = String(photo.nom).replace(/^[/\\]+/, '').replace(/\\/g, '/')

  return `/${['images', chemin, nom].filter(Boolean).map(encodeURIComponent).join('/')}`
}

function getDossierUrl(dossier) {
  const relativePath = String(dossier).replace(/^[/\\]+/, '').replace(/\\/g, '/')
  return `/doc/${relativePath.split('/').map(encodeURIComponent).join('/')}`
}

async function loadSpectacle() {
  if (!props.slug) {
    spectacle.value = null
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch(`/api/spectacles/${encodeURIComponent(props.slug)}`)

    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'Spectacle introuvable.'
          : `Impossible de charger les informations du spectacle (erreur serveur ${res.status}).`,
      )
    }

    spectacle.value = await res.json()

    const photos = await fetch(`/api/images/${spectacle.value.id}`)
    if (photos.ok) {
      spectacle.value.photos = await photos.json()
    } else {
      spectacle.value.photos = []
    }

    if (spectacle.value.photos.length > 0) {
      let couverture = spectacle.value.photos.find((p) => p.position === 0)
      if (couverture) {
        spectacle.value.couverture = couverture
      }
    }
  } catch (err) {
    errorMessage.value = err.message || 'Impossible de charger le spectacle.'
    spectacle.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadSpectacle)
watch(() => props.slug, loadSpectacle)
</script>

<template>
  <section class="spectacle-page">
    <div class="page-actions">
      <button class="back-link" @click="emit('back')">← Retour à l'accueil</button>
      <button
        v-if="spectacle && canEdit"
        class="edit-button"
        type="button"
        @click="emit('edit', spectacle.page)"
      >
        Modifier
      </button>
    </div>

    <div v-if="loading" class="state">Chargement...</div>
    <div v-else-if="errorMessage" class="state error">{{ errorMessage }}</div>
    <div v-else-if="spectacle" class="content">
      <div class="spectacle-layout">
        <div v-if="spectacle.couverture" class="cover">
          <img
            :src="getImageUrl(spectacle.couverture)"
            :alt="spectacle.couverture.description || spectacle.nom"
          />
        </div>

        <div class="text-block">
          <h2>{{ spectacle.nom + (spectacle.annee ? ` (${spectacle.annee})` : '') }}</h2>
          <p v-if="spectacle.annee" class="year">{{ spectacle.annee }}</p>
          <template v-if="spectacle.description">
            <p
              v-for="(paragraph, index) in formatDescription(spectacle.description)"
              :key="`${spectacle.id || 'spectacle'}-${index}`"
              class="description"
            >
              {{ paragraph }}
            </p>
          </template>
          <div v-if="spectacle.dossier" class="dossier">
            <a :href="getDossierUrl(spectacle.dossier)" target="_blank" rel="noopener noreferrer">
              Télécharger le dossier pédagogique
            </a>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="state">Aucun spectacle trouvé.</div>
  </section>
</template>

<style scoped>
.spectacle-page {
  width: 100%;
  min-height: 100vh;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.back-link {
  border: none;
  background: none;
  color: var(--color-heading);
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
}

.page-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.edit-button {
  border: none;
  border-radius: 999px;
  background: var(--color-heading);
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font: inherit;
}

.content {
  background: transparent;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.spectacle-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
}

.cover {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-width: 0;
}

.cover img {
  display: block;
  width: 100%;
  max-width: 100%;
  max-height: calc(100vh - 220px);
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.08);
}

.text-block {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
}

h2 {
  margin-top: 0;
  overflow-wrap: anywhere;
}

.year {
  font-weight: 600;
  color: var(--color-heading);
}

.description {
  margin: 0;
  text-align: justify;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.description:empty {
  min-height: 1em;
}

.dossier {
  margin-top: 1rem;
}

.state {
  padding: 1.5rem 0;
}

.error {
  color: #b91c1c;
}

@media (min-width: 900px) {
  .spectacle-layout {
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
  }

  .cover {
    width: 42%;
    max-width: 42%;
    flex: 0 0 42%;
    min-width: 0;
  }

  .cover img {
    max-width: 100%;
    width: auto;
    max-height: calc(100vh - 220px);
  }

  .text-block {
    width: 50%;
    max-width: 50%;
    flex: 0 0 50%;
    min-width: 0;
  }
}
</style>
