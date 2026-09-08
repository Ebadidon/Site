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
const imageUrls = import.meta.glob('../assets/images/**/*', {
  eager: true,
  import: 'default',
  query: '?url',
})

function getImageUrl(photo) {
  if (!photo?.chemin || !photo?.nom) {
    return ''
  }

  return imageUrls[`../assets/images/${photo.chemin}/${photo.nom}`] || ''
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
      throw new Error('Spectacle introuvable')
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
      <h2>{{ spectacle.nom }}</h2>
      <div v-if="spectacle.couverture" class="cover">
        <img
          :src="getImageUrl(spectacle.couverture)"
          :alt="spectacle.couverture.description || spectacle.nom"
          style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 1rem;"
        />
      </div>
      <p v-if="spectacle.annee" class="year">{{ spectacle.annee }}</p>
      <p style="text-align: justify;">{{ spectacle.description }}</p>
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
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 900px;
}

h2 {
  margin-top: 0;
}

.year {
  font-weight: 600;
  color: var(--color-heading);
}

.state {
  padding: 1.5rem 0;
}

.error {
  color: #b91c1c;
}
</style>
