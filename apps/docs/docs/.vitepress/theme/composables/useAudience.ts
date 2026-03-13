import { ref } from 'vue';

export type Audience = 'human' | 'agent';
export const audience = ref<Audience>('human');
