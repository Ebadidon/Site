<script setup>
import { ref } from 'vue'

const emit = defineEmits(['login-success', 'back'])

const form = ref({
  username: '',
  password: '',
})
const loading = ref(false)
const errorMessage = ref('')

async function submitLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form.value),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.error || 'Identifiants invalides.')
    }

    emit('login-success', data.user)
  } catch (err) {
    errorMessage.value = err.message || 'Connexion impossible.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="login-page">
    <button class="back-link" type="button" @click="emit('back')">← Retour à l'accueil</button>

    <h2>Connexion administrateur</h2>

    <form class="login-form" @submit.prevent="submitLogin">
      <label>
        Nom d'utilisateur
        <input v-model="form.username" required placeholder="username" />
      </label>

      <label>
        Mot de passe
        <input v-model="form.password" type="password" required placeholder="••••••••" />
      </label>

      <button class="submit-button" type="submit" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.login-page {
  width: 100%;
  max-width: 520px;
  margin: 2rem auto;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
}

.back-link {
  border: none;
  background: none;
  color: var(--color-heading);
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  margin-bottom: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 600;
}

input {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.04);
  color: inherit;
}

.submit-button {
  border: none;
  border-radius: 999px;
  background: var(--color-heading);
  color: white;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font: inherit;
}

.error {
  margin-top: 1rem;
  color: #fca5a5;
}
</style>
