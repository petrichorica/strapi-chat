export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {

    const io = require("socket.io")(strapi.server.httpServer, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: "my-custom-header",
        credentials: true,
      },
    });

    io.on("connection", (socket) => {

      let socketUserid;

      socket.on("join", ({username}) => {
        console.log("socketid", socket.id);
        console.log("User connected");
        console.log("Username is:", username);
        if (username) {
          socket.join("group");
          socket.emit("welcome", {
            user: "bot",
            text: `${username}, welcome to the group chat`,
            userData: username
          });
          const strapiData = {
            data: {
              user: username,
              socketid: socket.id,
              active: true
            }
          };
          const axios = require("axios");
          axios.post("http://localhost:1337/api/active-users", strapiData)
          .then((e) => {
            socketUserid = e.data.data.id;
            socket.emit("roomData", {done: "true"});
          })
          .catch((e) => {
            if (e.message == "Request failed with status code 400") {
              socket.emit("roomData", {done: "existing"});
              axios.get("http://localhost:1337/api/active-users?filters[user][$eq]=" + username)
              .then((res) => {
                const id = res.data.data[0].id;
                socketUserid = id;
                return axios.put(`http://localhost:1337/api/active-users/${id}`, strapiData)
              })
              .catch((err) => {
                console.log("update active status error", err.message);
              })
            }
          })
        } else {
          console.log("username error");
        }
      });

      socket.on("sendMessage", async (data) => {
        const strapiData = {
          data: {
            user: data.user,
            message: data.message
          },
        };
        const axios = require("axios");
        axios.post("http://localhost:1337/api/messages", strapiData)
        .then((e) => {
          socket.broadcast.to("group").emit("message", {
            user: data.username,
            text: data.message
          });
        })
        .catch((e) => {
          console.log("sendmessage error", e.message);
        })
      })

      socket.on("disconnect", (reason) => {
        if (socketUserid) {
          const axios = require('axios');
          const strapiData = {
            data: {
              active: false,
            },
          };
          axios.put(`http://localhost:1337/api/active-users/${socketUserid}`, strapiData)
          .catch((err) => {
            console.log("disconnect error", err.message);
          })
        }
      })
    })
  },
};
