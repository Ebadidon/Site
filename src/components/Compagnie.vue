<script setup>
import { ref } from 'vue'

defineProps({
  msg: {
    type: String,
    required: true,
  },
})

const contactEmail = ref('')

function revealContactEmail() {
  contactEmail.value = String.fromCharCode(
    116, 104, 101, 97, 116, 114, 101, 101, 98, 97, 100, 105, 100, 111, 110, 97, 115, 98, 108,
    64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
  )
}
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <!-- <h3>
      LA COMPAGNIE
      <a href="https://vite.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>.
    </h3> -->
    <div style="text-align: justify;">
    <p style="margin-bottom:0.75em">La Compagnie Ebadidon a été créée en 1987.</p>
<p style="margin-bottom:0.75em">Notre démarche artistique se veut ouverte à différentes techniques. La parole y occupe une place discrète ; le visuel, l’émotionnel et un humour burlesque s’y entremêlent pour atteindre un but essentiel&nbsp;: toucher ce qu'il y a de plus profond en nous-mêmes.</p>
<p>Dans le cadre de nos ateliers, nous insistons sur le fait que jouer, c’est agir&nbsp;! Le jeu théâtral permet de faire évoluer les personnes d’un état passif à une attitude active et créative.</p>
<p>Il permet à chacun d’explorer et de découvrir son propre sens artistique et sa créativité.</p>
    </div>
    <div>
    <img class="illustration" src="@/assets/accueil.jpg" alt="Photo de la compagnie Ebadidon" />
    </div>
    <section class="contact" aria-labelledby="contact-heading">
    <header>
      <h2 id="contact-heading" style="display:inline-block;">Théâtre EBADIDON asbl</h2>
        <a
          class="facebook-link"
          href="https://www.facebook.com/ebadidon1"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Page Facebook du Théâtre Ebadidon"
          style="margin-left: 50px; display: inline-block;"
        >
          <svg class="facebook-logo" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.016 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.976h-1.513c-1.49 0-1.956.931-1.956 1.887v2.261h3.328l-.532 3.49h-2.796V24C19.612 23.089 24 18.092 24 12.073Z"
            />
          </svg>
        </a>
      </header>
      <p><strong>BCE :</strong> 434373720</p>
      <p>
        <strong>Mail :&nbsp;</strong>
        <button v-if="!contactEmail" class="contact-email-button" type="button" @click="revealContactEmail">
          Afficher l’adresse e-mail
        </button>
        <a v-else :href="`mailto:${contactEmail}`">{{ contactEmail }}</a>
      </p>
      <p>
        <strong>Téléphone :</strong>
        <a href="tel:+32497366643">+32 497 36 66 43</a>
      </p>
    </section>
  </div>
</template>

<style scoped>
.greetings {
  width: 100%;
  min-width: 0;
}

.illustration {
  display: block;
  width: 100%;
  max-width: 600px;
  height: auto;
  margin-top: 1rem;
  border-radius: 0.5rem;
}

h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
}

h3 {
  font-size: 1.2rem;
}

.contact {
  margin: 1.5rem 0 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-heading);
}

.contact h2 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  font-weight: 500;
}

.contact p {
  margin: 0.2rem 0;
}

.contact a {
  display: inline;
  color: #000;
}

.contact .facebook-link {
  display: inline-flex;
  padding: 0;
  color: #1877f2;
  vertical-align: middle;
}

.facebook-logo {
  display: block;
  width: 1.75rem;
  height: 1.75rem;
}

.contact-email-button {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
