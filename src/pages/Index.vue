<template>
  <q-page class="row items-center justify-center">
    <ckb-burner class="col-6" />
  </q-page>
</template>

<script lang="ts">
import Vue from 'vue';

import CkbBurner from 'components/CkbBurner.vue';

export default Vue.extend({
  name: 'PageIndex',
  components: { CkbBurner },
});
</script>
