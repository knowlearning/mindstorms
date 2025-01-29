<script setup>
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

  defineProps({
  	icon: String
  })

</script>

<template>
  <button>
    <FontAwesomeIcon
      :icon="icon"
    />
  </button>
</template>