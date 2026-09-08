<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  slug: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    default: 'add',
  },
})

const emit = defineEmits(['back'])

const form = ref({
  nom: '',
  description: '',
  page: '',
  annee: '',
  categories: [],
})

const categories = ref([])
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const spectacleId = ref(null)

const isEditMode = computed(() => props.mode === 'edit' && !!props.slug)
const pageTitle = computed(() =>
  isEditMode.value ? "Modifier un spectacle" : "Ajouter un spectacle"
)

async function loadCategories() {
  try {
    const res = await fetch('/api/categories')
    if (!res.ok) {
      throw new Error('Impossible de charger les catégories.')
    }

    categories.value = await res.json()
  } catch (err) {
    errorMessage.value = err.message || 'Impossible de charger les catégories.'
  }
}

function resetForm() {
  form.value = {
    nom: '',
    description: '',
    page: '',
    annee: '',
    categories: [],
  }
  spectacleId.value = null
}

async function loadSpectacle() {
  if (!isEditMode.value) {
    spectacleId.value = null
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const res = await fetch(`/api/spectacles/${encodeURIComponent(props.slug)}`)

    if (!res.ok) {
      throw new Error('Spectacle introuvable.')
    }

    const data = await res.json()
    spectacleId.value = data.id
    form.value = {
      nom: data.nom || '',
      description: data.description || '',
      page: data.page || '',
      annee: data.annee == null ? '' : String(data.annee),
      categories: Array.isArray(data.categories) ? data.categories : [],
    }
  } catch (err) {
    errorMessage.value = err.message || 'Impossible de charger le spectacle.'
    resetForm()
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  if (!form.value.categories.length) {
    errorMessage.value = 'Sélectionne au moins une catégorie.'
    loading.value = false
    return
  }

  try {
    const payload = {
      ...form.value,
      annee: form.value.annee === '' ? null : Number(form.value.annee),
      categories: form.value.categories.map(Number),
    }

    const endpoint = isEditMode.value
      ? `/api/spectacles/${spectacleId.value}`
      : '/api/spectacles'
    const method = isEditMode.value ? 'PUT' : 'POST'

    if (isEditMode.value && !spectacleId.value) {
      throw new Error('Impossible de mettre à jour le spectacle.')
    }

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.error || 'Impossible d’enregistrer le spectacle.')
    }

    const action = isEditMode.value ? 'modifié' : 'ajouté'
    successMessage.value = `Le spectacle « ${data.spectacle?.nom || form.value.nom} » a bien été ${action}.`
    if (!isEditMode.value) {
      resetForm()
    }
  } catch (err) {
    errorMessage.value = err.message || 'Une erreur est survenue.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
  if (isEditMode.value) {
    loadSpectacle()
  }
})

watch(
  () => props.slug,
  (newSlug) => {
    if (isEditMode.value && newSlug) {
      loadSpectacle()
    } else if (!isEditMode.value) {
      resetForm()
    }
  }
)
</script>

<template>
  <section class="add-page">
    <button class="back-link" type="button" @click="emit('back')">← Retour à l'accueil</button>

    <h2>{{ pageTitle }}</h2>

    <form class="form" @submit.prevent="submitForm">
      <label>
        Nom
        <input v-model="form.nom" required placeholder="Nom du spectacle" />
      </label>

      <label>
        Description
        <textarea v-model="form.description" rows="6" required placeholder="Description courte du spectacle" />
      </label>

      <label>
        Page
        <input v-model="form.page" required placeholder="Nom de la page" />
      </label>

      <label>
        Année
        <input v-model="form.annee" type="number" min="1980" max="2040" />
      </label>

      <fieldset class="categories-fieldset">
        <legend>Catégories</legend>
        <div v-if="categories.length" class="checkbox-list">
          <label v-for="category in categories" :key="category.id" class="checkbox-option">
            <input v-model="form.categories" type="checkbox" :value="category.id" />
            <span>{{ category.name }}</span>
          </label>
        </div>
        <p v-else class="hint">Chargement des catégories…</p>
      </fieldset>

      <button class="submit-button" type="submit" :disabled="loading">
        {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </form>

    <p v-if="successMessage" class="success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.add-page {
  position: relative;
  width: 100vw;
  max-width: none;
  min-height: 100vh;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  background: var(--color-background);
}

.back-link {
  border: none;
  background: none;
  color: var(--color-heading);
  cursor: pointer;
  font-size: 1rem;
  padding: 0 0 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-weight: 600;
}

.categories-fieldset {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  max-width: 80%;
  width:auto;
}

.checkbox-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.checkbox-option {
  display: inline-block;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
  min-width: 100px;
}

input,
textarea,
select {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem 0.9rem;
  font: inherit;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text);
  max-width: 80%;
}

.checkbox-option input {
  width: auto;
  margin-right: 0.4rem;
}

@media (max-width: 600px) {
  input,
  textarea,
  select {
    max-width: 90%;
  }
}
textarea {
  resize: vertical;
}

.submit-button {
  align-self: flex-start;
  padding: 0.75rem 1.1rem;
  border: none;
  border-radius: 8px;
  background: var(--color-heading);
  color: white;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.success {
  margin-top: 1rem;
  color: #15803d;
}

.hint {
  margin: 0;
  color: var(--color-text);
  opacity: 0.8;
}

.error {
  margin-top: 1rem;
  color: #b91c1c;
}
</style>
