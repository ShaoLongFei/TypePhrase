import { ref } from "vue";

const practiceIndex = ref(0);

export function usePractice() {
  return {
    practiceIndex,
  };
}
