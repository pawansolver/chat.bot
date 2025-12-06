const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const modelSelect = document.querySelector("#model-select");
const countSelect = document.querySelector("#count-select");
const ratioSelect = document.querySelector("#ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
];

// DARK MODE INIT
(() => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.querySelector("i").className = isDark
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
})();

const toggleTheme = () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.querySelector("i").className = isDark
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
};

// GET IMAGE DIMENSIONS
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [w, h] = aspectRatio.split("/").map(Number);
  const factor = baseSize / Math.sqrt(w * h);

  let W = Math.floor((w * factor) / 16) * 16;
  let H = Math.floor((h * factor) / 16) * 16;

  return { width: W, height: H };
};

// UPDATE IMAGE CARD
const updateImageCards = (index, imgurl) => {
  const imgCard = document.getElementById(`img-card-${index}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");

  imgCard.innerHTML = `
    <img src="${imgurl}" class="result-img">
    <div class="img-overlay">
      <a href="${imgurl}" class="img-download-btn" download="${Date.now()}.png">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>
  `;
};

// GENERATE IMAGE USING BACKEND
const generateImage = async (selectedModel, imageCount, aspectRatio, promptText) => {

  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText
        }),
      });

      const result = await response.json();

      // HuggingFace returns base64 image → convert to blob
      const base64Data = result[0]?.image || result?.image;

      if (!base64Data) throw new Error("Invalid image response");

      const byteCharacters = atob(base64Data.split(",")[1]);
      const byteNumbers = new Array(byteCharacters.length);

      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }

      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });

      const imgURL = URL.createObjectURL(blob);
      updateImageCards(i, imgURL);

    } catch (error) {
      console.log(error);
    }
  });

  await Promise.allSettled(imagePromises);
};

// CREATE IMAGE CARDS
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  gridGallery.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio};">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>
    `;
  }

  generateImage(selectedModel, imageCount, aspectRatio, promptText);
};

// FORM SUBMIT HANDLER
const handleFormSubmit = (e) => {
  e.preventDefault();

  const selectedModel = modelSelect.value;
  const imageCount = Number(countSelect.value);

  let aspectRatio = ratioSelect.value || "1/1";

  const promptText = promptInput.value.trim();
  if (!promptText) return;

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// RANDOM PROMPT BUTTON
promptBtn.addEventListener("click", () => {
  const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = randomPrompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
