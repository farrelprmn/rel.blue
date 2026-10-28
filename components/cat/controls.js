import { useSyncExternalStore } from "react";

let jumps = 0;
const jumpListeners = new Set();
const petListeners = new Set();

const getJumps = () => jumps;

function subscribeJumps(fn) {
  jumpListeners.add(fn);
  return () => {
    jumpListeners.delete(fn);
  };
}

export function addJump() {
  jumps++;
  jumpListeners.forEach((fn) => fn());
}

export function onPet(fn) {
  petListeners.add(fn);
  return () => {
    petListeners.delete(fn);
  };
}

function pet() {
  petListeners.forEach((fn) => fn());
}

let exitHandler = null;

export function onExit(fn) {
  exitHandler = fn;
  return () => {
    if (exitHandler === fn) exitHandler = null;
  };
}

export const exitCat = () => (exitHandler ? exitHandler() : Promise.resolve());

export function PetButton() {
  return (
    <button type="button" onClick={() => pet()}>
      pet the cat
    </button>
  );
}

export function JumpCounter() {
  const count = useSyncExternalStore(subscribeJumps, getJumps, () => 0);
  return <span>{count}</span>;
}
