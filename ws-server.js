"use strict";
//load web socket server and http server
const WebSocket = require("ws").Server;
const server = require("http").createServer();

//load game model for mongoDB
const Game = require("./models/game");

//laod app for request handling and loggedUsers for checking if user is logged in
const { app, loggedUsers } = require("./app.js");

//load chess.js for chess logic
const { Chess } = require("chess.js");

//create web socket server
const wss = new WebSocket({ server: server });

//set app to handle requests
var res = server.on("request", app);

//array of Games
var games = new Array();

//web socket server
wss.on("connection", (socket, req) => {
  console.log("Connection established");
  //console.log(wss.clients);
  var user = currentPlayer(req);
  checkIfUserIsInGame(user, socket);
  var game = currentGame(user);

  //handle if socket is closed
  socket.onclose = () => {
    console.log("connection closed");
    // console.log(user);
    //get current game for user
    game = currentGame(user);
    console.log(game);
    setTimeout(() => {
      if (game == null) {
        console.log("game is finished");
        return;
      }
      
      if (game.player1socket == null) {
        //if player 1 is not online more than 5sec send message to player 2
        if (game.player2socket != null) {
          game.player2socket.send(
            JSON.stringify({
              type: "OpponentSurrendered",
            })
          );
          game.player2socket.close();
        }
        games = games.filter((iter) => iter != game);
        return;
      }
      if (game.player2socket == null) {
        //if player 2 is not online more than 5sec send message to player 1
        console.log("user 2 napustio igtu");
        if (game.player1socket != null) {
          game.player1socket.send(
            JSON.stringify({
              type: "OpponentSurrendered",
            })
          );
          game.player1socket.close();
        }
        games = games.filter((iter) => iter != game);
        return;
      }
    }, 5000);
    console.log("izasao nakon 2 sec");
    DissconnectHandler();

    function DissconnectHandler() {
      if (game != null && game.player1 == user) {
        //if player 1 is not online set his socket to null
        //and send message to player 2
        game.player1socket = null;
        if (game.player2socket != null)
          game.player2socket.send(
            JSON.stringify({
              type: "OpponentDisconnected",
              chess: game.chess.fen(),
              turn: game.chess._turn,
            })
          );
      }
      if (game != null && game.player2 == user) {
        //if player 2 is not online set his socket to null
        //and send message to player 1
        game.player2socket = null;
        if (game.player1socket != null)
          game.player1socket.send(
            JSON.stringify({
              type: "OpponentDisconnected",
              chess: game.chess.fen(),
              turn: game.chess._turn,
            })
          );
      }
    }
  };

  //handle if message is received
  socket.on("message", (message) => {
    var data = JSON.parse(message);
    switch (data.type) {
      case "move":
        //fist load sent fen and then make move
        game.chess.load(data.fen);
        game.chess.fen();

        if (game.chess.isGameOver()) {
          console.log("game over");
          GameOverHandler();
        } else {
          UpdateHandler();
        }
        break;
    }

    function UpdateHandler() {
      game.player1socket.send(
        JSON.stringify({
          type: "updateBoard",
          chess: game.chess.fen(),
          turn: game.chess._turn,
        })
      );
      game.player2socket.send(
        JSON.stringify({
          type: "updateBoard",
          chess: game.chess.fen(),
          turn: game.chess._turn,
        })
      );
    }

    function GameOverHandler() {
      game.player1socket.send(
        JSON.stringify({
          type: "gameOver",
          chess: game.chess.fen(),
          turn: game.chess._turn,
        })
      );
      game.player2socket.send(
        JSON.stringify({
          type: "gameOver",
          chess: game.chess.fen(),
          turn: game.chess._turn,
        })
      );
      game.player1socket.close();
      game.player2socket.close();
      games = games.filter((iter) => iter != game);
    }
  });
});

server.listen(3001, () => {
  console.log("Listening on 3001");
});

//returns current player for session id get from cookie
function currentPlayer(req) {
  for (var user of loggedUsers) {
    var string = req.headers.cookie;
    // console.log(string);
    // console.log(user.session.id);
    // console.log(string.includes(user.session.id));
    if (string.includes(user.session.id)) return user;
  }
  return null;
}

//returns current game for user
function currentGame(user) {
  let index = games.findIndex(
    (game) => game.player1 == user || game.player2 == user
  );
  if (index == -1) return null;
  else return games[index];
}

//checks if user is in game
function checkIfUserIsInGame(user, socket) {
  let index = games.findIndex(
    (game) => game.player1 == user || game.player2 == user
  );
  //not in game add it to game
  if (index == -1) {
    addUserToGame(user, socket);
  } //already in game update socket and send board
  else {
    AlreadyInGameHandler();
  }
  return true;

  function AlreadyInGameHandler() {
    if (games[index].player1 == user && games[index].player2 != null) {
      games[index].player1socket = socket;
      games[index].player1socket.send(
        JSON.stringify({
          type: "gameStart",
          color: "white",
          chess: games[index].chess.fen(),
          turn: games[index].chess._turn,
        })
      );
    } 
    if (games[index].player2 == user && games[index].player1 != null)
    {
      games[index].player2socket = socket;
      games[index].player2socket.send(
        JSON.stringify({
          type: "gameStart",
          color: "black",
          chess: games[index].chess.fen(),
          turn: games[index].chess._turn,
        })
      );
    }
  }
}

//adds user to game and if there is no game creates new one
function addUserToGame(user, socket) {
  if (games.length == 0) {
    var chess = new Chess();
    console.log("flag");
    //console.log(chess.fen());
    var game = new Game({
      player1: user,
      player1socket: socket,
      player2: null,
      player2socket: null,
      chess: chess,
    });
    console.log(game.chess.fen());
    games.push(game);
    return;
  } else {
    let index = games.findIndex((game) => game.player2 == null && game.player1 != user && game.player1socket != null);
    console.log(index);
    if (index == -1) {
      var chess = new Chess();
      var game = new Game({
        player1: user,
        player1socket: socket,
        player2: null,
        player2socket: null,
        chess: chess,
      });
      //console.log(game);
      games.push(game);

    console.log(games);
    } else {
      games[index].player2 = user;
      games[index].player2socket = socket;
      games[index].player1socket.send(
        JSON.stringify({
          type: "gameStart",
          color: "white",
          chess: games[index].chess.fen(),
        })
      );
      games[index].player2socket.send(
        JSON.stringify({
          type: "gameStart",
          color: "black",
          chess: games[index].chess.fen(),
        })
      );
      console.log(games);
    }
    
  }
}
