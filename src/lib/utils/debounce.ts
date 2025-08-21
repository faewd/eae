export function debounce(func: () => void, delay: number): () => void {
  let timer: number;

  return () => {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
}
