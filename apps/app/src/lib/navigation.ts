import { router } from 'expo-router';

/** Closes a modal route; falls back to the hub when it was opened by deep link. */
export const closeModal = () => (router.canGoBack() ? router.back() : router.replace('/'));
