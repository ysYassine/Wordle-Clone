import Data from "../model/data.js";

const data = new Data();
const guessGrid = document.querySelector("[data-guess-grid]");
const alertContainer = document.querySelector("[data-alert-container]");

startInteraction();

function startInteraction() {
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(event) {
  if (event.target.matches("[data-key]")) {
    pressKey(event.target.dataset.key);
    return;
  }
  if (event.target.matches("[data-enter]")) {
    submitGuess();
    return;
  }
  if (event.target.matches("[data-delete]")) {
    deleteKeyPressed();
    return;
  }
}

function handleKeyPress(event) {
  if (event.key === "Enter") {
    submitGuess();
    return;
  }
  if (event.key === "Backspace" || event.key === "Delete") {
    deleteKeyPressed();
    return;
  }
  // ^[]$ stands for 1 signle letter
  if (event.key.match(/^[a-z]$/)) {
    pressKey(event.key);
    return;
  }
}

function pressKey(key) {
  const activeTiles = getActiveTiles();
  if (activeTiles.length >= data.wordLength) return;
  const nextTile = guessGrid.querySelector(":not([data-letter])");
  //   Add data-letter=
  nextTile.dataset.letter = key.toLowerCase();
  //   Add data-state=
  nextTile.dataset.state = "active";
  //   Add key text to UI
  nextTile.textContent = key;
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

function deleteKeyPressed() {
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  console.log(lastTile);
  lastTile.textContent = "";
  delete lastTile.dataset.state;
  delete lastTile.dataset.letter;
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  if (activeTiles.length !== data.wordLength) {
    showAlert("Not enough letters");
  }
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alertContainer.prepend(alert);
  if (duration == null) return;
  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => {
      alert.remove();
    });
  }, duration);
}
