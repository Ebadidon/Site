<script setup>
import Spectacles from "./Spectacles.vue";
import SpectaclePage from "./SpectaclePage.vue";
import EcosystemIcon from "./icons/IconEcosystem.vue";
import SupportIcon from "./icons/IconSupport.vue";
import GalleryIcon from "./icons/IconGallery.vue";
import HistoryIcon from "./icons/IconHistory.vue";
import sablioscopeImage from "@/assets/sablioscope.jpg";
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  canEdit: {
    type: Boolean,
    default: false,
  },
});

const showSablioscope = ref(false);
let timer = null;
const vueBasePath =
  window.location.pathname === "/old" || window.location.pathname.startsWith("/old/")
    ? "/old"
    : "";

const spectacles = ref([]);
const spectaclesEnfants = ref([]);
const toutpublic = ref([]);
const selectedSlug = ref("");
const showDetail = ref(false);

const emit = defineEmits(["edit-spectacle", "spectacle-opened", "spectacle-closed"]);

function emitEdit(slug) {
  emit("edit-spectacle", slug);
}

function hasCategory(spectacle, categoryId) {
  const categories = Array.isArray(spectacle.categories)
    ? spectacle.categories
    : spectacle.categorie
    ? [spectacle.categorie]
    : [];

  return categories.includes(categoryId);
}

async function loadSpectacles() {
  try {
    const res = await fetch("/api/spectacles");
    if (res.ok) {
      spectacles.value = await res.json();
      spectaclesEnfants.value = spectacles.value.filter((s) => hasCategory(s, 2));
      toutpublic.value = spectacles.value.filter((s) => hasCategory(s, 5));
    } else {
      console.error("Failed to load spectacles", res.status);
    }
  } catch (err) {
    console.error("Error fetching spectacles", err);
  }
}

function syncDetailFromUrl() {
  const spectacleParam = new URLSearchParams(window.location.search).get("spectacle");

  if (spectacleParam) {
    const nextSlug = decodeURIComponent(spectacleParam);
    selectedSlug.value = nextSlug;
    showDetail.value = true;
    emit("spectacle-opened", nextSlug);
    return;
  }

  if (showDetail.value || selectedSlug.value) {
    showDetail.value = false;
    selectedSlug.value = "";
    emit("spectacle-closed");
  }
}

function openSpectacle(slug) {
  selectedSlug.value = slug;
  showDetail.value = true;

  const targetUrl = `${vueBasePath}/?spectacle=${encodeURIComponent(slug)}`;
  window.history.pushState({ view: "spectacle", slug }, "", targetUrl);

  emit("spectacle-opened", slug);
}

function backToHome() {
  if (window.history.state && window.history.state.view === "spectacle") {
    window.history.back();
    return;
  }

  showDetail.value = false;
  selectedSlug.value = "";
  emit("spectacle-closed");
}

onMounted(() => {
  loadSpectacles();
  syncDetailFromUrl();
  window.addEventListener("popstate", syncDetailFromUrl);
});

onUnmounted(() => {
  window.removeEventListener("popstate", syncDetailFromUrl);
});

function showImage() {
  showSablioscope.value = true;

  clearTimeout(timer);

  timer = setTimeout(() => {
    showSablioscope.value = false;
  }, 3000);
}
</script>

<template>
  <div v-if="showDetail" class="detail-view">
    <SpectaclePage
      :slug="selectedSlug"
      :can-edit="canEdit"
      @back="backToHome"
      @edit="emitEdit"
    />
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
      <template #heading> Spectacles tout public </template>
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

    <Spectacles>
      <template #icon>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <path
            d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3.4A7.5 7.5 0 1 1 20 11.5Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </template>
      <template #heading>
        <a class="section-link" :href="`${vueBasePath}/commentaires`">Commentaires</a>
      </template>
    </Spectacles>

    <Spectacles>
      <template #icon>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <path
            d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path d="M9 3v15m6-12v15" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </template>
      <template #heading>
        <a class="section-link" :href="`${vueBasePath}/carte`">Où avons-nous été ?</a>
      </template>
    </Spectacles>

    <Transition name="fade">
      <div v-if="showSablioscope" class="overlay">
        <img :src="sablioscopeImage" class="sablioscope" />
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
  width: 100%;
  min-height: calc(100vh - 4rem);
}

.detail-view :deep(.spectacle-page) {
  width: 100%;
  min-height: calc(100vh - 4rem);
  padding: 0 0 2rem;
}

.detail-view :deep(.content) {
  width: 100%;
  max-width: none;
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
