<script setup>
defineProps({
  msg: {
    type: String,
    required: true,
  },
})
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
    <p>La Compagnie Ebadidon a été créée en 1987.</p>
<p>Sa démarche artistique se veut ouverte à différentes techniques. La parole y existe peu ; le visuel, l’émotionnel et l’humour burlesque s’y enchevêtrent pour viser un but : celui de toucher le plus profond de nous-même.
Jouer, c’est agir&nbsp;! Le jeu théâtral permet de faire évoluer les personnes d’un état passif à une attitude active et créative.
Il permet à chacun d’explorer et de découvrir son propre sens artistique et sa créativité.</p>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
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
