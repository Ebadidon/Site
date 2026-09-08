<script setup>
import Spectacles from './Spectacles.vue'
import SpectaclePage from './SpectaclePage.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import SupportIcon from './icons/IconSupport.vue'
import GalleryIcon from './icons/IconGallery.vue'
import HistoryIcon from './icons/IconHistory.vue'
import sablioscopeImage from '@/assets/sablioscope.jpg'
import { ref, onMounted } from 'vue'

const props = defineProps({
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const showSablioscope = ref(false)
let timer = null
const vueBasePath = window.location.pathname === '/old' || window.location.pathname.startsWith('/old/')
  ? '/old'
  : ''

const spectacles = ref([])
const spectaclesEnfants = ref([])
const toutpublic = ref([])
const selectedSlug = ref('')
const showDetail = ref(false)

const emit = defineEmits(['edit-spectacle'])

function emitEdit(slug) {
  emit('edit-spectacle', slug)
}

function hasCategory(spectacle, categoryId) {
  const categories = Array.isArray(spectacle.categories)
    ? spectacle.categories
    : spectacle.categorie
      ? [spectacle.categorie]
      : []

  return categories.includes(categoryId)
}

async function loadSpectacles() {
  try {
    const res = await fetch('/api/spectacles')
    if (res.ok) {
      spectacles.value = await res.json()
      spectaclesEnfants.value = spectacles.value.filter(s => hasCategory(s, 2))
      toutpublic.value = spectacles.value.filter(s => hasCategory(s, 5))
    } else {
      console.error('Failed to load spectacles', res.status)
    }
  } catch (err) {
    console.error('Error fetching spectacles', err)
  }
}

function openSpectacle(slug) {
  selectedSlug.value = slug
  showDetail.value = true
}

function backToHome() {
  showDetail.value = false
  selectedSlug.value = ''
}

onMounted(() => {
  loadSpectacles()
})

function showImage() {
  showSablioscope.value = true

  clearTimeout(timer)

  timer = setTimeout(() => {
    showSablioscope.value = false
  }, 3000)
}
</script>

<template>
  <div v-if="showDetail" class="detail-view">
    <SpectaclePage :slug="selectedSlug" :can-edit="canEdit" @back="backToHome" @edit="emitEdit" />
  </div>

  <template v-else>
    <Spectacles>
      <template #icon>
        <EcosystemIcon />
      </template>
      <template #heading>Spectacles jeune public</template>
      <template v-if="spectaclesEnfants.length">
        <button
          v-for="(s, i) in spectaclesEnfants"
          :key="i"
          class="link-button"
          type="button"
          @click="openSpectacle(s.page)"
        >
          {{ s.nom }}
        </button>
      </template>
      <template v-else>
        <button class="link-button" type="button">Chargement...</button>
      </template>
    </Spectacles>

    <Spectacles>
      <template #icon>
        <SupportIcon />
      </template>
      <template #heading>
        Spectacles tout public
      </template>
      <template v-if="toutpublic.length">
        <button
          v-for="(s, i) in toutpublic"
          :key="i"
          class="link-button"
          type="button"
          @click="openSpectacle(s.page)"
        >
          {{ s.nom }}
        </button>
      </template>
      <template v-else>
        <button class="link-button" type="button">Chargement...</button>
      </template>
    </Spectacles>

    <Spectacles>
      <template #icon>
        <GalleryIcon />
      </template>
      <template #heading>
        <a class="section-link" :href="`${vueBasePath}/galerie`">Galerie</a>
      </template>
    </Spectacles>

    <Spectacles>
      <template #icon>
        <HistoryIcon />
      </template>
      <template #heading>
        <a class="section-link" :href="`${vueBasePath}/historique`">Historique</a>
      </template>
    </Spectacles>

    <Transition name="fade">
      <div v-if="showSablioscope" class="overlay">
        <img :src="sablioscopeImage" class="sablioscope">
      </div>
    </Transition>
  </template>
</template>

<style scoped>
.link-button {
  display: block;
  background: none;
  border: none;
  color: var(--color-heading);
  text-align: left;
  padding: 0.25rem 0;
  cursor: pointer;
  font: inherit;
}

.section-link {
  color: inherit;
  text-decoration: none;
}

.section-link:hover,
.section-link:focus-visible {
  text-decoration: underline;
}

.detail-view {
  margin-top: 1rem;
}

.overlay {
  position: fixed;
  inset: 0;

  background: rgba(0, 0, 0, 0.35);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 1000;
}

.sablioscope {
  width: 700px;
  max-width: 90vw;

  animation: arrive 1s ease;
  animation: apparition 1.5s ease-out forwards;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes arrive {
  from {
    transform: translateX(300px) scale(0.8);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes apparition {
  0% {
    opacity: 0;
    transform: translateY(150px) scale(0.2) rotate(-8deg);
    filter: blur(8px);
  }

  60% {
    opacity: 1;
    transform: translateY(0) scale(0.8) rotate(1deg);
    filter: blur(0);
  }

  100% {
    transform: scale(0.75);
  }
}
</style>

<style scoped>

.overlay{

    position:fixed;
    inset:0;

    background:rgba(0,0,0,.35);

    display:flex;
    justify-content:center;
    align-items:center;

    z-index:1000;
}

.sablioscope{

    width:700px;
    max-width:90vw;

    animation:arrive 1s ease;
    animation: apparition 1.5s ease-out forwards;
}

.fade-enter-active,
.fade-leave-active{

    transition:opacity .6s;
}

.fade-enter-from,
.fade-leave-to{

    opacity:0;
}

@keyframes arrive{

    from{

        transform:translateX(300px) scale(.8);
        opacity:0;
    }

    to{

        transform:translateX(0);
        opacity:1;
    }

}

@keyframes apparition {

    0% {
        opacity: 0;
        transform: translateY(150px) scale(0.2) rotate(-8deg);
        filter: blur(8px);
    }

    60% {
        opacity: 1;
        transform: translateY(0) scale(0.8) rotate(1deg);
        filter: blur(0);
    }

    100% {
        transform: scale(0.75);
    }
}

</style>