<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

const emit = defineEmits(['back'])

const mapElement = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const markerCount = ref(0)
const appBasePath =
  window.location.pathname === '/old' || window.location.pathname.startsWith('/old/')
    ? '/old'
    : ''

let map
let markers

L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
})

function parseCoordinate(value, min, max) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null
  }

  const coordinate = Number(value)
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : null
}

function addLocationMarker(location) {
  const marker = L.marker([location.latitude, location.longitude])
  const popup = document.createElement('div')

  if (location.lieu) {
    const place = document.createElement('strong')
    place.textContent = location.lieu
    popup.append(place)
  }

  const list = document.createElement('ul')
  for (const { spectacle, representation } of location.representations) {
    const entry = document.createElement('li')
    const title = document.createElement('strong')
    title.textContent = spectacle.nom || 'Spectacle'
    entry.append(title, document.createElement('br'))

    if (representation.description) {
      const details = document.createElement('div')
      details.textContent = representation.description
      entry.append(details)
    }

    if (spectacle.page) {
      const link = document.createElement('a')
      link.href = `${appBasePath}/?spectacle=${encodeURIComponent(spectacle.page)}`
      link.textContent = 'Voir le spectacle'
      entry.append(link)
    }

    list.append(entry)
  }
  popup.append(list)

  marker.bindPopup(popup)
  marker.addTo(markers)
  return marker.getLatLng()
}

async function loadRepresentations() {
  try {
    const response = await fetch('/api/representations')
    if (!response.ok) {
      throw new Error(`Impossible de charger les représentations (erreur serveur ${response.status}).`)
    }

    const spectacles = await response.json()
    if (!Array.isArray(spectacles)) {
      throw new Error('Le format des représentations reçu du serveur est invalide.')
    }

    const locations = new Map()
    let representationCount = 0
    for (const spectacle of spectacles) {
      if (!Array.isArray(spectacle.representations)) {
        continue
      }

      for (const representation of spectacle.representations) {
        if (!representation || typeof representation !== 'object') {
          continue
        }

        const latitude = parseCoordinate(representation.latitude, -90, 90)
        const longitude = parseCoordinate(representation.longitude, -180, 180)
        if (latitude === null || longitude === null) {
          continue
        }

        const locationKey =
          representation.lieuId !== null && representation.lieuId !== undefined
            ? `lieu:${representation.lieuId}`
            : `coords:${latitude},${longitude}:${representation.lieu || ''}`
        let location = locations.get(locationKey)
        if (!location) {
          location = {
            latitude,
            longitude,
            lieu: representation.lieu,
            representations: [],
          }
          locations.set(locationKey, location)
        }

        location.representations.push({ spectacle, representation })
        representationCount += 1
      }
    }

    const positions = Array.from(locations.values(), addLocationMarker)
    markerCount.value = representationCount
    if (positions.length === 1) {
      map.setView(positions[0], 10)
    } else if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions).pad(0.15), { maxZoom: 10 })
    }
  } catch (error) {
    errorMessage.value = error.message || 'Impossible de charger les représentations.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  map = L.map(mapElement.value).setView([50.5, 4.5], 7)
  markers = L.layerGroup().addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  loadRepresentations()
})

onUnmounted(() => {
  map?.remove()
})
</script>

<template>
  <section class="map-page">
    <div class="page-header">
      <button class="back-link" type="button" @click="emit('back')">← Retour à l'accueil</button>
      <h1>Où avons-nous été ?</h1>
      <p v-if="!loading && !errorMessage">
        {{ markerCount }} représentation{{ markerCount === 1 ? '' : 's' }} affichée{{ markerCount === 1 ? '' : 's' }}
      </p>
    </div>

    <p v-if="loading" class="state" role="status">Chargement des représentations...</p>
    <p v-else-if="errorMessage" class="state error" role="alert">{{ errorMessage }}</p>
    <p v-else-if="markerCount === 0" class="state">Aucune représentation avec des coordonnées à afficher.</p>
    <div ref="mapElement" class="map" aria-label="Carte des lieux de représentation" />
  </section>
</template>

<style scoped>
.map-page {
  min-height: 100vh;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
}

h1 {
  color: var(--color-heading);
  font-size: 1.5rem;
  text-align: center;
}

.page-header p {
  text-align: right;
}

.back-link {
  width: fit-content;
  border: none;
  background: none;
  color: var(--color-heading);
  cursor: pointer;
  font: inherit;
  padding: 0;
}

.map {
  flex: 1;
  min-height: 60vh;
  border-radius: 0.75rem;
  z-index: 0;
}

.state {
  color: var(--color-text);
}

.error {
  color: #b91c1c;
}

@media (max-width: 650px) {
  .map-page {
    padding: 1rem;
  }

  .page-header {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 0.35rem;
  }

  h1,
  .page-header p {
    text-align: left;
  }

  .map {
    min-height: 65vh;
  }
}
</style>
