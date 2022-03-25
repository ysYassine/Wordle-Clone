import Data from "../model/data.js";
import { setCharAt, mobileAndTabletCheck } from "../utils/utils.js";

const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;

const data = new Data();
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const keyboard = document.querySelector("[data-keyboard]");

const NOT_ENOUGH_LETTERS_MSG = "Not enough letters";
const NOT_A_WORD_MSG = "Not a word";
const ALREADY_TRIED = "Word already tried";
const WIN_MSGS = [
  "SUS",
  "EPIC!",
  "PHENOMENAL!",
  "GOOD JOB!",
  "NICE!",
  "THAT WAS CLOSE!",
];

const LOCAL_STORAGE_HISTORY_KEY = "guessHistory";

const guessHistory = JSON.parse(
  localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY)
) ?? {
  date: new Date(),
  guesses: {},
};

startInteraction();
addOldSessionsTries();

function addOldSessionsTries() {
  const historyDate = new Date(guessHistory.date);
  if (historyDate.toDateString() !== data.wordDate.toDateString()) {
    resetLocalStorage();
  }
  let elementIndex = 0;
  for (const property in guessHistory.guesses) {
    //Add old sessions'words to the UI
    property.split("").forEach((letter) => {
      pressKey(letter, true);
    });
    //Color the word
    const tiles = [...getActiveTiles()];
    property.split("").forEach((_, letterIndex) => {
      flipTile(
        tiles[elementIndex * 5 + letterIndex],
        letterIndex,
        tiles.slice(elementIndex * 5, elementIndex * 5 + 5),
        property,
        false
      );
    });
    elementIndex++;
  }
}

function resetLocalStorage() {
  guessHistory.date = data.wordDate;
  guessHistory.guesses = {};
  updateLocalStorage();
}

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

function pressKey(key, firstLoad = false) {
  const activeTiles = getActiveTiles();
  // if already 5 words are typed return
  if (!firstLoad && activeTiles.length >= data.wordLength) return;
  // get a reference for the first empty box that doesn't contain a letter
  const nextTile = guessGrid.querySelector(":not([data-letter])");
  // Add data-letter=
  nextTile.dataset.letter = key.toLowerCase();
  // Add data-state=
  nextTile.dataset.state = "active";
  // Add key text to UI
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

function submitGuess(updateHistory = true) {
  // getActiveTiles return Nodes so we need to convert it to a normal Array
  const activeTiles = [...getActiveTiles()];

  if (activeTiles.length !== data.wordLength) {
    showAlert(NOT_ENOUGH_LETTERS_MSG);
    shakeTiles(activeTiles);
    return;
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "");

  if (!data.dictionnary.includes(guess)) {
    showAlert(NOT_A_WORD_MSG);
    shakeTiles(activeTiles);
    return;
  }
  if (guessHistory.guesses[guess] != null) {
    showAlert(ALREADY_TRIED);
    shakeTiles(activeTiles);
    return;
  }
  stopInteraction();
  checkLettersPositions(guess);
  if (updateHistory) updateLocalStorage();
  activeTiles.forEach((...params) => flipTile(...params, guess, updateHistory));
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  if (duration == null) {
    createShareMsg(alert, !mobileAndTabletCheck());
    alertContainer.prepend(alert);
    return;
  }
  alertContainer.prepend(alert);
  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => {
      alert.remove();
    });
  }, duration);
}

function createShareMsg(alert, desktop) {
  const shareText = document.createElement("div");
  shareText.textContent =
    "Click here to" + (desktop ? " copy " : " share ") + "results";
  shareText.classList.add("share-text");
  alert.append(shareText);
  alertContainer.addEventListener("click", () => {
    if (!desktop) {
      if (navigator.share) {
        navigator.share({
          text: generateClipboard(),
        });
      } else {
        navigator.clipboard.writeText(generateClipboard());
      }
    } else {
      navigator.clipboard.writeText(generateClipboard());
    }
  });
}

function checkLettersPositions(guess) {
  // Intermediate variables
  let targetWordVar = data.targetWord;
  let guessVar = guess;
  // Empty the tables
  const correctIndexes = [];
  const wrongLocationIndexes = [];
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
  guessHistory.guesses[guess] = {
    correctIndexes: correctIndexes,
    wrongLocationIndexes: wrongLocationIndexes,
  };
}

function checkWinLose(guess, tiles) {
  const guessHistoryLength = Object.keys(guessHistory.guesses).length;
  const latestGuess = Object.keys(guessHistory.guesses)[guessHistoryLength - 1];
  if (guess === data.targetWord) {
    showAlert(WIN_MSGS[guessHistoryLength - 1], null);
    danceTiles(tiles);
    stopInteraction();
    return;
  }
  if (guess !== latestGuess) return;
  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    showAlert(data.targetWord.toUpperCase(), null);
    stopInteraction();
  }
}

function updateLocalStorage() {
  localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(guessHistory));
}

function generateClipboard() {
  let msg = "";
  let attempsCount = 0;
  for (const word in guessHistory.guesses) {
    attempsCount++;
    for (let j = 0; j < word.length; j++) {
      if (guessHistory.guesses[word].correctIndexes.includes(j)) {
        msg += "🟩";
      } else if (guessHistory.guesses[word].wrongLocationIndexes.includes(j)) {
        msg += "🟨";
      } else {
        msg += "⬛";
      }
    }
    msg += `
`;
  }
  if (attempsCount === 6 && guessHistory.guesses[data.targetWord] == null)
    attempsCount = "X";
  msg =
    "Wordle-Clone " +
    data.dayCount +
    " " +
    attempsCount +
    "/6" +
    `

` +
    msg;
  return msg;
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

function flipTile(tile, index, array, guess) {
  stopInteraction();
  const letter = tile.dataset.letter;
  //   add i after " to make it case insensitive
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);
  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * FLIP_ANIMATION_DURATION) / 2);
  tile.addEventListener(
    "transitionend",
    () => colorTiles(tile, index, array, guess, key),
    { once: true }
  );
}

function colorTiles(tile, index, array, guess, key) {
  tile.classList.remove("flip");
  if (guessHistory.guesses[guess].correctIndexes.includes(index)) {
    tile.dataset.state = "correct";
    key.classList.add("correct");
  } else if (guessHistory.guesses[guess].wrongLocationIndexes.includes(index)) {
    tile.dataset.state = "wrong-location";
    key.classList.add("wrong-location");
  } else {
    tile.dataset.state = "wrong";
    key.classList.add("wrong");
  }
  if (index == array.length - 1) {
    startInteraction();
    checkWinLose(guess, array);
  }
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
