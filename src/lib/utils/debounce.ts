export function debounce(func: () => void, delay: number): () => void {
  let timer: NodeJS.Timeout;

  return () => {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
}
