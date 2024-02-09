const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/user");
const Admin = require("./models/admin");
var ChessWebAPI = require("chess-web-api");
const app = express();

var chessAPI = new ChessWebAPI();
//array of logged users
var loggedUsers = new Array();

//const for mongo db url
const dbUrl =
  "mongodb+srv://chessGame:chess123@nodecc.9ciscng.mongodb.net/?retryWrites=true&w=majority";

//const for session secret and cookie life time
const secret = "secret";
const oneDay = 1000 * 60 * 60 * 24;

//set for ejs template engine
app.set("view engine", "ejs");

mongoose
  .connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    console.log("connection established to mongodb");
    //httpServer = app.listen(port);

    //console.log("listening on port 3001");
  })
  .catch((err) => {
    console.log("error connecting to mongodb: " + err);
  });

//static middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
  })
);

//routes
app.get("/", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) res.render("index", { username: null });
  else {
    res.render("index", {
      username: loggedUser.username,
      name: loggedUser.name,
      lastname: loggedUser.lastname,
    });
  }
});

app.get("/signUp", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) {
    res.render("signUp", { failed: null });
    return;
  }
  res.redirect("/");
});

app.post("/signUp", (req, res) => {
  const user = new User(req.body);
  User.find({ username: user.username }).then((result) => {
    if (result.length > 0) {
      res.render("signUp", { failed: true });
    } else {
      console.log("in else part");
      user.save();
      res.render("signUp", { failed: false });
    }
  });
});

app.get("/logIn", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) {
    res.render("logIn", { postRoute: "/logIn", failed: null, loggedIn: false });
    return;
  }
  res.redirect("/");
});

app.post("/logIn", (req, res) => {
  User.findOne({ username: req.body.username }).then((result) => {
    const user = new User(result);

    //bad username
    if (result == null) {
      res.render("logIn", {
        postRoute: "/logIn",
        failed: true,
        loggedIn: false,
      });
      return;
    }

    //bad password
    if (user.password != req.body.password) {
      //console.log("in else part" + user.id);
      res.render("logIn", {
        postRoute: "/logIn",
        failed: true,
        loggedIn: false,
      });
      return;
    }

    //save user id in session and pushing that session to loggedUsers array
    var loggedIn = false;

    if (loggedUsers.length == 0)
      loggedUsers.push({ session: req.session, user: user });
    else {
      loggedUsers.forEach((loggedUser) => {
        if (loggedUser.user.username != user.username) {
          loggedUsers.push({ session: req.session, user: user });
          loggedIn = false;
        } else {
          loggedIn = true;
        }
      });
    }
    if (loggedIn) {
      res.render("logIn", {
        postRoute: "/logIn",
        failed: false,
        loggedIn: true,
      });
      return;
    } else {
      res.redirect("/gameMenu");
      console.log("Logged in user id:" + user.id);
      console.log(loggedUsers);
      return;
    }
  });
});

app.get("/logOut", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) res.redirect("/");
  else {
    //removing user from loggedUsers array
    loggedUsers = loggedUsers.filter(
      (user) => user.session.id != req.session.id
    );
    console.log(loggedUsers);
    req.session.destroy();
    res.redirect("/");
  }
});

app.get("/gameMenu", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) res.redirect("/");
  else {
    var leaderboards;
    chessAPI
      .getLeaderboards()
      .then((result) => {
        leaderboards = result.body.daily;
        console.log(leaderboards);
        res.render("gameMenu", {
          username: loggedUser.username,
          name: loggedUser.name,
          lastname: loggedUser.lastname,
          TopPlayers: leaderboards,
        });

      })
      .catch((err) => {
        res.render("gameMenu", {
          username: loggedUser.username,
          name: loggedUser.name,
          lastname: loggedUser.lastname,
          TopPlayers: leaderboards,
        });
      });
  }
});

app.get("/board", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) res.redirect("/");
  else {
    res.render("board");
  }
});

app.get("/test", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) res.redirect("/");
  else {
    res.render("testLobby", {
      username: loggedUser.username,
      name: loggedUser.name,
      lastname: loggedUser.lastname,
    });
  }
});

app.get("/changePassword", (req, res) => {
  var loggedUser = isLoggedIn(req);
  if (!loggedUser) res.redirect("/");
  else {
    res.render("changePassword", {
      failed: null,
      username: loggedUser.username,
      name: loggedUser.name,
      lastname: loggedUser.lastname,
    });
  }
});

app.post("/changePassword", (req, res) => {
  var loggedUser = isLoggedIn(req);
  console.log(req);
  console.log(loggedUser);
  if (!loggedUser) {
    res.redirect("/");
    return;
  }
  User.findOne({ username: loggedUser.username }).then((result) => {
    const user = new User(result);
    if (user.password != req.body.oldPassword) {
      res.render("changePassword", {
        failed: 1,
        username: loggedUser.username,
        name: loggedUser.name,
        lastname: loggedUser.lastname,
      });
      return;
    }
    user.password = req.body.newPassword;
    user.save();
    res.render("changePassword", {
      failed: 2,
      username: loggedUser.username,
      name: loggedUser.name,
      lastname: loggedUser.lastname,
    });
  });
});

//admin routes
app.get("/admin", (req, res) => {
  var loggedAdmin = isLoggedInAdmin(req);
  if (!loggedAdmin)
    res.render("logIn", {
      postRoute: "/adminLogIn",
      formType: "Admin",
      failed: null,
      loggedIn: false,
    });
  else {
    let error = req.query.error;
    User.find().then((result) => {
      console.log(result);
      res.render("admin", { users: result, error: error });
    });
  }
});

app.post("/adminLogIn", (req, res) => {
  Admin.findOne({ username: req.body.username }).then((result) => {
    const admin = new Admin(result);
    if (admin.password != req.body.password) {
      res.render("logIn", {
        postRoute: "/adminLogIn",
        formType: "Admin",
        failed: true,
        loggedIn: false,
      });
      return;
    }
    req.session.admin = admin;
    res.redirect("/admin");
  });
});

app.post("/updateUser", (req, res) => {
  console.log(req.body);
  User.findByIdAndUpdate(req.body.id, {
    name: req.body.name,
    lastname: req.body.lastname,
    username: req.body.username,
    password: req.body.password,
  })
    .then((result) => {
      console.log(result);
      res.redirect("/admin");
    })
    .catch((err) => {
      console.log(err);
      let error = encodeURIComponent("Error updating user");
      res.redirect("/admin?erro" + error);
    });
});

app.post("/deleteUser", (req, res) => {
  User.findByIdAndDelete(req.body.id)
    .then((result) => {
      console.log(result);
      res.redirect("/admin");
    })
    .catch((err) => {
      console.log(err);
      let error = encodeURIComponent("Error deleting user");
      res.redirect("/admin?erro" + error);
    });
});

//404 page handler
app.use((req, res, next) => {
  res.status(404).render("404");
});

module.exports = { app: app, loggedUsers: loggedUsers };

//check if user is logged in and return user or false
function isLoggedIn(req) {
  var loggedUser = loggedUsers.find(
    (user) => user.session.id == req.session.id
  );

  return loggedUser != undefined ? loggedUser.user : false;
}

//check if admin is logged in and return admin or false
function isLoggedInAdmin(req) {
  return req.session.admin != undefined ? req.session.admin : false;
}
