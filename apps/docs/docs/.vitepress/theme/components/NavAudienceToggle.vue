<script setup lang="ts">
import { audience } from '../composables/useAudience';
</script>

<template>
  <div class="nav-audience-toggle" role="tablist" aria-label="Audience mode">
    <button
      role="tab"
      :class="['nav-toggle-btn', { active: audience === 'human' }]"
      :aria-selected="audience === 'human'"
      @click="audience = 'human'"
    >
      For Humans
    </button>
    <button
      role="tab"
      :class="['nav-toggle-btn', { active: audience === 'agent' }]"
      :aria-selected="audience === 'agent'"
      @click="audience = 'agent'"
    >
      For Agents
    </button>
  </div>
</template>
