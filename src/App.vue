<script setup>
import { computed, onMounted, ref } from 'vue'
import Compagnie from './components/Compagnie.vue'
import HomeView from './components/HomeView.vue'
import AddSpectaclePage from './components/AddSpectaclePage.vue'
import LoginPage from './components/LoginPage.vue'
import GalleryPage from './components/GalleryPage.vue'
import HistoryPage from './components/HistoryPage.vue'

const currentView = ref('home')
const selectedSlug = ref('')
const currentUser = ref(loadStoredUser())
const appBasePath = window.location.pathname === '/old' || window.location.pathname.startsWith('/old/')
  ? '/old'
  : ''

const isAdmin = computed(() => {
  const user = currentUser.value
  return !!user && user.administration !== null && user.administration !== undefined && user.administration !== ''
})

function isAdminUser(user) {
  return !!user && user.administration !== null && user.administration !== undefined && user.administration !== ''
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('ebadidon-user')
    if (!raw) return null

    const user = JSON.parse(raw)
    return isAdminUser(user) ? user : null
  } catch {
    return null
  }
}

function saveUser(user) {
  if (user && isAdminUser(user)) {
    localStorage.setItem('ebadidon-user', JSON.stringify(user))
    return
  }

  localStorage.removeItem('ebadidon-user')
}

function updateUrl(path) {
  const appPath = path.startsWith('/') ? path : `/${path}`
  const nextPath = `${appBasePath}${appPath}`

  if (window.location.pathname !== nextPath) {
    window.history.pushState({}, '', nextPath)
  }
}

function goToHome() {
  selectedSlug.value = ''
  currentView.value = 'home'
  updateUrl('/')
}

function goToLogin() {
  selectedSlug.value = ''
  currentView.value = 'login'
  updateUrl('/connexion')
}

function goToGallery() {
  selectedSlug.value = ''
  currentView.value = 'gallery'
  updateUrl('/galerie')
}

function goToHistory() {
  selectedSlug.value = ''
  currentView.value = 'history'
  updateUrl('/historique')
}

function syncViewFromUrl() {
  const fullPathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const pathname = appBasePath && fullPathname === appBasePath
    ? '/'
    : appBasePath && fullPathname.startsWith(`${appBasePath}/`)
    ? fullPathname.slice(appBasePath.length)
    : fullPathname

  if (pathname === '/connexion') {
    if (isAdmin.value) {
      goToHome()
      return
    }

    currentView.value = 'login'
    return
  }

  if (pathname === '/galerie' || pathname === '/gallery') {
    currentView.value = 'gallery'
    return
  }

  if (pathname === '/historique' || pathname === '/history') {
    currentView.value = 'history'
    return
  }

  if (pathname.startsWith('/edit/')) {
    if (!isAdmin.value) {
      goToLogin()
      return
    }

    selectedSlug.value = decodeURIComponent(pathname.slice('/edit/'.length))
    currentView.value = 'edit'
    return
  }

  if (pathname === '/add' || pathname === '/ajouter') {
    if (!isAdmin.value) {
      goToLogin()
      return
    }

    selectedSlug.value = ''
    currentView.value = 'add'
    return
  }

  goToHome()
}

function showAddPage() {
  if (!isAdmin.value) {
    goToLogin()
    return
  }

  selectedSlug.value = ''
  currentView.value = 'add'
  updateUrl('/add')
}

function openEditPage(slug) {
  if (!isAdmin.value) {
    goToLogin()
    return
  }

  selectedSlug.value = slug
  currentView.value = 'edit'
  updateUrl(`/edit/${encodeURIComponent(slug)}`)
}

function backToHome() {
  goToHome()
}

function handleLoginSuccess(user) {
  currentUser.value = user
  saveUser(user)

  if (isAdmin.value) {
    goToHome()
  } else {
    goToLogin()
  }
}

function logout() {
  currentUser.value = null
  saveUser(null)
  goToLogin()
}

onMounted(() => {
  syncViewFromUrl()
  window.addEventListener('popstate', syncViewFromUrl)
})
</script>

<template>
  <header v-if="currentView !== 'login' && currentView !== 'gallery' && currentView !== 'history'">
    <img alt="Vue logo" class="logo" src="./assets/ebadidon-logo-email.png" width="125" height="125" />

    <div class="wrapper">
      <Compagnie msg="LA COMPAGNIE" />
      <button v-if="isAdmin" class="add-button" type="button" @click="showAddPage">Ajouter un spectacle</button>
      <button v-if="currentUser" class="logout-button" type="button" @click="logout">
        Déconnexion ({{ currentUser.username }})
      </button>
      <!-- <button v-else class="login-button" type="button" @click="goToLogin">Connexion</button> -->
    </div>
  </header>

  <main :class="{ 'gallery-mode': currentView === 'gallery', 'history-mode': currentView === 'history' }">
    <LoginPage v-if="currentView === 'login'" @login-success="handleLoginSuccess" @back="goToHome" />
    <GalleryPage v-else-if="currentView === 'gallery'" @back="goToHome" />
    <HistoryPage v-else-if="currentView === 'history'" @back="goToHome" />
    <HomeView
      v-else-if="currentView === 'home'"
      :can-edit="isAdmin"
      @edit-spectacle="openEditPage"
    />
    <AddSpectaclePage v-else-if="currentView === 'add'" @back="backToHome" />
    <AddSpectaclePage
      v-else-if="currentView === 'edit'"
      :slug="selectedSlug"
      mode="edit"
      @back="backToHome"
    />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
    gap: 1rem;
  }
}

.add-button,
.gallery-button,
.history-button,
.login-button,
.logout-button {
  border: none;
  border-radius: 999px;
  background: var(--color-heading);
  color: white;
  padding: 0.65rem 1rem;
  cursor: pointer;
  font: inherit;
}

.gallery-mode {
  grid-column: 1 / -1;
  width: 100%;
}

.history-mode {
  grid-column: 1 / -1;
  width: 100%;
}

:global(body:has(.gallery-mode)),
:global(body:has(.history-mode)) {
  display: block;
  margin: 0;
}

:global(#app:has(.gallery-mode)),
:global(#app:has(.history-mode)) {
  width: 100%;
  max-width: none;
  padding: 0;
  display: block;
}
</style>
