let main = new Worker("./main.js", { type: "module" });

let workers = Array.from(
  { length: navigator.hardwareConcurrency },
  () => new Worker("./worker.js", { type: "module" })
);

main.addEventListener('message', ({ data: { type, data } }) => {
  if (type === 'spawn') {
    workers.pop().postMessage(data);
  }
});

let ID = 0;

export function optimise(...args) {
  return new Promise((resolve, reject) => {
    let sendId = ID++;

    main.addEventListener('message', function onMessage({ data: { ok, id, result } }) {
      if (id !== sendId) return;
      main.removeEventListener('message', onMessage);
      if (ok) {
        resolve(result);
      } else {
        reject(result);
      }
    });

    main.postMessage({ id: sendId, args });
  });
}
