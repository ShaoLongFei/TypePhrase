import { ref } from "vue";

const statementIndex = ref(0);

export function useStatement() {
  return {
    statementIndex,
  };
}
