let socket = io();

const joinButton = document.querySelector("#joinButton");
const username = document.querySelector("#username");
const room = document.querySelector("#room");
const chatContainer = document.querySelector("#chat");
const joinContainer = document.querySelector("#join");
const historyDiv = document.querySelector("#history");
const input = document.querySelector("#input");
const send = document.querySelector("#send");
const roomTitle = document.querySelector("#roomTitle");
const onlineContainer = document.querySelector("#online");
const chatSroll = document.querySelector("#chatScroll");
const closeButton = document.querySelector("#closeButton");
const search = document.querySelector("#search");

joinButton.addEventListener("click", joinHandler);
send.addEventListener("click", sendMessage);
input.addEventListener("keyup", onEnterPress);
search.addEventListener("change", handleSearch);

function onEnterPress(event) {
  if (event.keyCode === 13) {
    sendMessage();
  }
}

let allMessages = [];
let user = "";
let roomName = "";
let errorr;
let alredyLogIn = false;
let firstLogin = false;

if (
  window.localStorage.getItem("USER") &&
  window.localStorage.getItem("ROOM")
) {
  alredyLogIn = true;
  user = window.localStorage.getItem("USER");
  roomName = window.localStorage.getItem("ROOM");
  joinHandler();
}
function joinHandler() {
  errorr = false;
  if (!alredyLogIn) {
    user = username.value;
    roomName = room.value;
  }

  if (user && roomName) {
    socket.emit("join", { room: roomName, name: user }, loginError);
  }
}

socket.on("history", (history) => {
  if (!errorr) {
    window.localStorage.setItem("USER", user);
    window.localStorage.setItem("ROOM", roomName);
  }
  let filteredMessages = history.messages.filter(
    (message) => message.room === roomName
  );
  allMessages = filteredMessages.reverse().concat(allMessages);
  addNewMessage(allMessages);
  historyDiv.scrollTop = historyDiv.scrollHeight;
});

socket.on("message", (message) => {
  allMessages.push(message);
  chatContainer.style.display = "flex";
  joinContainer.style.display = "none";
  if (!message.first) addNewMessage([message]);
  historyDiv.scrollTop = historyDiv.scrollHeight;
});

socket.on("searchData", (messages) => {
  addNewMessage(messages.messages, "clean");
});

socket.on("roomData", (data) => {
  let room = document.createTextNode("Room: " + data.room);
  roomTitle.innerHTML = "";
  roomTitle.appendChild(room);
  let users = data.users;
  onlineContainer.innerHTML = "";
  let title = document.createElement("div");
  title.className = "outerDiv";
  let titleContent = document.createTextNode("online:");
  title.appendChild(titleContent);
  onlineContainer.appendChild(title);
  users.forEach((user) => {
    const outerDiv = document.createElement("div");
    outerDiv.className = "outerDiv";
    const newUser = document.createElement("span");
    const content = document.createTextNode(user.name);
    newUser.appendChild(content);
    const icon = document.createElement("div");
    icon.className = "iconOnline";
    outerDiv.appendChild(icon);
    outerDiv.appendChild(newUser);

    onlineContainer.appendChild(outerDiv);
  });
});

window.onbeforeunload = closeWindow;

function closeWindow() {
  socket.emmit("disconect");
}

function loginError(error) {
  errorr = true;
  let element = document.createElement("p");
  let content = document.createTextNode(error);
  element.appendChild(content);
  joinContainer.removeChild(joinContainer.lastChild);
  joinContainer.appendChild(element);
  user = "";
  roomName = "";
}

const test = () => {
  return;
};

function sendMessage(e) {
  let message = input.value;
  socket.emit("sendMessage", message, test);
  input.value = "";
}

function addNewMessage(allMessages, clean) {
  if (clean) {
    historyDiv.innerHTML = "";
  }
  let container;
  allMessages.forEach((message) => {
    container = document.createElement("div");
    let username = document.createElement("span");
    username.className = "userHistory";
    let mesg = document.createElement("div");

    mesg.className = "mesgHistory";

    let usernameContent = document.createTextNode(message.user);
    let mesgContent = document.createTextNode(message.text);
    username.appendChild(usernameContent);
    mesg.appendChild(mesgContent);

    if (message.user === user) {
      container.appendChild(username);
      container.appendChild(mesg);
      container.className = "floatLeft";
    } else {
      container.appendChild(mesg);
      container.appendChild(username);
      container.className = "floatRight";
    }
    historyDiv.appendChild(container);
    container = null;
  });
  historyDiv.scrollTop = historyDiv.scrollHeight;
}

closeButton.addEventListener("click", (event) => {
  socket.disconnect();
  alredyLogIn = false;
  window.localStorage.removeItem("USER");
  window.localStorage.removeItem("ROOM");
  chatContainer.style.display = "none";
  joinContainer.style.display = "flex";
  input.removeEventListener("keyup", onEnterPress);
  location.reload();
});

function handleSearch(e) {
  let text = e.target.value;
  socket.emit("search", text);
}
