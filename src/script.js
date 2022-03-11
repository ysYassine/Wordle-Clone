import Data from "../model/data.js";

const data = new Data();
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const keyboard = document.querySelector("[data-keyboard]");

// letters indexes containers
const correctIndexes = [];
const wrongLocationIndexes = [];

const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;

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
  if (lastTile == null) return;
  lastTile.textContent = "";
  delete lastTile.dataset.state;
  delete lastTile.dataset.letter;
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  if (activeTiles.length !== data.wordLength) {
    showAlert("Not enough letters");
    shakeTiles(activeTiles);
    return;
  }
  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "");
  if (!data.dictionnary.includes(guess)) {
    showAlert("Not a word");
    shakeTiles(activeTiles);
    return;
  }
  stopInteraction();
  checkLettersPositions(guess);
  activeTiles.forEach((...params) => flipTile(...params, guess));
}

function checkLettersPositions(guess) {
  // Intermediate variables
  let targetWordVar = data.targetWord;
  let guessVar = guess;
  // Empty the tables
  correctIndexes.splice(0, correctIndexes.length);
  wrongLocationIndexes.splice(0, wrongLocationIndexes.length);
  // Get correct letters indexes
  for (let index = 0; index < guess.length; index++)
    if (guess[index] === data.targetWord[index]) correctIndexes.push(index);
  // Change correct letters to exclude them from next treatments
  correctIndexes.forEach((index) => {
    guessVar = setCharAt(guessVar, index, "-");
    targetWordVar = setCharAt(targetWordVar, index, "@");
  });
  // Search for wrong-position letters, save their index and remove them from next treatments
  for (let index = 0; index < guessVar.length; index++) {
    if (correctIndexes.includes(index)) continue;
    if (targetWordVar.includes(guessVar[index])) {
      let indexInTarget = targetWordVar.indexOf(guessVar[index]);
      guessVar = setCharAt(guessVar, index, "-");
      targetWordVar = setCharAt(targetWordVar, indexInTarget, "@");
      wrongLocationIndexes.push(index);
    }
  }
}

function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter;
  //   add i after " to make it case insensitive
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);
  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * FLIP_ANIMATION_DURATION) / 2);
  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");
      if (correctIndexes.includes(index)) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (wrongLocationIndexes.includes(index)) {
        tile.dataset.state = "wrong-location";
        key.classList.add("wrong-location");
      } else {
        tile.dataset.state = "wrong";
        key.classList.add("wrong");
      }
      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction();
            checkWinLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
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

function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}
function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * DANCE_ANIMATION_DURATION) / 5);
  });
}

function checkWinLose(guess, tiles) {
  if (guess === data.targetWord) {
    showAlert("You win", 5000);
    danceTiles(tiles);
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    showAlert(data.targetWord.toUpperCase(), null);
  }
}
