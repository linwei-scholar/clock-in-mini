import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

export * from './authStore';
export * from './tagStore';
export * from './planStore';
export * from './recordStore';
export * from './settingsStore';
