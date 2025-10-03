const socket = io();
let username = "";

// ---- Set Username ----
function setUsername() {
  const input = document.getElementById("username");
  if (input.value.trim() === "") return alert("Enter a name!");
  username = input.value;

  // Switch screens
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "flex";

  document.getElementById("user-label").innerText = `Logged in as: ${username}`;

  socket.emit("newUser", username);
}

// ---- Display Chat Messages ----
socket.on("chatMessage", (data) => {
  const box = document.getElementById("chat-box");
  const isMe = data.user === username;
  const msgClass = isMe ? "msg user" : "msg other";

  const wrapper = document.createElement('div');
  wrapper.className = msgClass;
  wrapper.innerHTML = `<b>${data.user}:</b> ${data.text}`;
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
});

// ---- Display Shared Files ----
socket.on("fileShared", (data) => {
  const box = document.getElementById("chat-box");
  const isMe = data.user === username;
  const msgClass = isMe ? "msg user" : "msg other";

  const sizeText = data.size ? ` (${(data.size/1024).toFixed(1)} KB)` : "";

  const wrapper = document.createElement('div');
  wrapper.className = msgClass;
  wrapper.innerHTML = `
    <b>${data.user}:</b>
    <div class="file-card">
      <i class='bx bxs-file'></i>
      <a href="${data.fileUrl}" target="_blank">${data.fileName}</a>
      <span>${sizeText}</span>
    </div>`;
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
});

// ---- Send Message ----
function sendMessage() {
  const input = document.getElementById("msg");
  const msg = input.value;
  if (msg.trim() !== "") {
    socket.emit("chatMessage", { user: username, text: msg });
    input.value = "";
  }
}

// ---- Send File ----
function sendFile() {
  const fileInput = document.getElementById("fileInput");
  const files = fileInput.files;

  if (!files.length) return alert("Select at least one file!");

  for (let file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", username);
    formData.append("size", file.size);

    fetch("/upload", { method: "POST", body: formData })
      .then(res => res.json())
      .then(data => console.log("File uploaded:", data));
  }
}

// ---- Drag & Drop File ----
const dropArea = document.getElementById("drop-area");
const selectedFiles = document.getElementById("selected-files");

function triggerFileBrowse() {
  document.getElementById('fileInput').click();
}

function updateSelectedFilesList(files) {
  if (!selectedFiles) return;
  if (!files || !files.length) {
    selectedFiles.textContent = "";
    return;
  }
  const names = Array.from(files).map(f => `${f.name} (${(f.size/1024).toFixed(1)} KB)`);
  selectedFiles.textContent = names.join(', ');
}

document.getElementById('fileInput').addEventListener('change', (e) => {
  updateSelectedFilesList(e.target.files);
});

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add('active');
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove('active');
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove('active');
  const files = e.dataTransfer.files;
  if (files.length) {
    updateSelectedFilesList(files);
    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user", username);
      formData.append("size", file.size);

      fetch("/upload", { method: "POST", body: formData })
        .then(res => res.json())
        .then(data => console.log("File uploaded:", data));
    }
  }
});
