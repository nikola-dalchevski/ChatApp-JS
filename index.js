const express = require("express");
const socketIo = require("socket.io");
const http = require("http");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const db = require("./databaseConnection");
const Message = require("./chat");
const uri = process.env.DATABASE_URL;

const app = express();
app.use("/public", express.static(__dirname + "/public"));

const server = http.createServer(app);
const io = socketIo(server);

io.on("connection", (socket) => {
  console.log("user is connected");
  socket.on("join", ({ name, room }, callback) => {
    Message.find()
      .sort({ createdAt: -1 })
      .exec((err, messages) => {
        socket.emit("history", {
          messages: messages,
        });
      });
    const { user, error } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);
    else {
      socket.emit("message", {
        user: "admin",
        text: `${user.name}, wlcome to the room ${user.room}`,
        first: true,
      });
    }

    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined` });
    socket.join(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const saveMessage = new Message({
      user: user.name,
      text: message,
      room: user.room,
    });
    saveMessage.save((err) => {
      if (err) console.log(err);
    });
    io.to(user.room).emit("message", {
      user: user.name,
      text: message,
    });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("search", (text) => {
    let count;
    text ? (count = 0) : (count = -99999999);
    Message.find().exec((err, messages) => {
      let filteredMessages = messages.filter((message, index) => {
        let test = message.text;
        if (count >= 20) return;
        if (test.indexOf(text) !== -1) {
          count++;
          return message;
        }
      });
      socket.emit("searchData", { messages: filteredMessages });
    });
  });
  // });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left the room`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
