import {
    INPUT_EVENT_TYPE,
    COLOR,
    Chessboard,
    BORDER_TYPE,
} from "/cm-chessboard/src/Chessboard.js";
import { PromotionDialog } from "/cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";
import {
    MARKER_TYPE,
    Markers,
} from "/cm-chessboard/src/extensions/markers/Markers.js";
import { Accessibility } from "/cm-chessboard/src/extensions/accessibility/Accessibility.js";
import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js";


console.log("creating socket connection");
const socket = new WebSocket("ws://localhost:3001");
var chess;
var board;
var color;
const player = document.getElementsByClassName("player");
const opponent = document.getElementsByClassName("opponent");

socket.onopen = () => {
    console.log("connection established");
    //socket.send("Hello from client");
};

socket.onmessage = (message) => {
    var data = JSON.parse(message.data);
    switch (data.type) {
        case "gameStart":
            console.log("game start");
            boardConfig(data);
            console.log(chess.turn());
            console.log("on the move" + data.turn + color);
            if((color == COLOR.white && chess.turn() == 'w')  || (color == COLOR.black && chess.turn() == 'b')){
                console.log("on the move in if" + chess._turn + color);
                board.enableMoveInput(inputHandler, color); 
            }
            break;
        case "OpponentDisconnected":
            console.log("opponent disconnected");
            break;
        case "OpponentSurrendered":
            document.getElementsByClassName("endPopUp")[0].style.visibility = "visible";
            document.getElementsByClassName("endPopUp")[0].style.zIndex = "10";
            document.getElementById('endPopUp_result').textContent = 'OPPONENT SURRENDERED';
            break;    
        case "updateBoard":
            console.log("update board");
            console.log(chess);
            updateBoard();
            break;
        case "gameOver":
            //update board for last time
            board.setPosition(data.chess, true);
            chess.load(data.chess);
            chess._turn = data.turn;
            console.log(chess);

            document.getElementsByClassName("endPopUp")[0].style.visibility = "visible";
            document.getElementsByClassName("endPopUp")[0].style.zIndex = "10";


            //need to check if checkmate and for what color it is
            if(chess.in_checkmate() && data.turn == color){
                document.getElementById('endPopUp_result').textContent = 'YOU LOSE';
            } 
            if(chess.in_checkmate() && data.turn != color){
                document.getElementById('endPopUp_result').textContent = 'YOU WIN';
            }
            if(chess.in_draw()){
                document.getElementById('endPopUp_result').textContent = 'DRAW';
            }
            break;
        
    }

    function updateBoard() {
        board.setPosition(data.chess, true);
        chess.load(data.chess);
        chess._turn = data.turn;
        console.log(chess);
        player[0].classList.toggle("onTheMove");
        opponent[0].classList.toggle("onTheMove");
            board.enableMoveInput(inputHandler, color);
        
    }

};

socket.onclose = () => {
    console.log("connection closed");
}

function boardConfig(data) {
    //set color and fen
    color = data.color == "white" ? COLOR.white : COLOR.black;
    var fen = data.chess;

    //create chess object
    chess = new Chess(fen);
    chess._turn = data.turn;


    //remove loading screen
    document.getElementsByClassName("loading")[0].style.display = "none";

    //set icons
    player[0].classList.toggle("visible")
    opponent[0].classList.toggle("visible")
    if (color == COLOR.white) {
        player[0].style.background= "white";
        player[0].style.color= "black";
        opponent[0].style.background = "black";
    }
    else {
        player[0].style.background = "black";
        opponent[0].style.background = "white";
        opponent[0].style.color = "black";
    }

    if(chess.turn() == color){
        player[0].classList.toggle("onTheMove")
    }else{
        opponent[0].classList.toggle("onTheMove")
    }



    //create board
    board = new Chessboard(document.getElementById("boardChess"), {
        position: fen,
        responsive: true,
        assetsUrl: "/cm-chessboard/assets/",
        style: { aspectRatio: 1, borderType: BORDER_TYPE.frame, pieces: { file: "pieces/staunty.svg" }, animationDuration: 300 },
        orientation: color,
        extensions: [
            { class: Markers, props: { autoMarkers: MARKER_TYPE.square } },
            { class: PromotionDialog },
            { class: Accessibility, props: { visuallyHidden: true } },
        ],
    })
}


function inputHandler(event) {
    console.log("inputHandler", event);
    if (event.type !== INPUT_EVENT_TYPE.moveInputFinished) {
        event.chessboard.removeMarkers(MARKER_TYPE.dot);
        event.chessboard.removeMarkers(MARKER_TYPE.bevel);
    }
    if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
        const moves = chess.moves({
            square: event.squareFrom,
            verbose: true,
        });
        console.log("moves", moves);
        for (const move of moves) {
            // draw dots on possible squares
            if (move.promotion && move.promotion !== "q") {
                continue;
            }
            if (event.chessboard.getPiece(move.to)) {
                console.log(event.chessboard.getPiece(move.to));
                event.chessboard.addMarker(MARKER_TYPE.bevel, move.to);
            } else {
                event.chessboard.addMarker(MARKER_TYPE.dot, move.to);
            }
        }
        return moves.length > 0;
    } else if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
        const move = {
            from: event.squareFrom,
            to: event.squareTo,
            promotion: event.promotion,
        };
        const result = chess.move(move);
        if (result) {
            this.chessboard.state.moveInputProcess.then(() => {
                // wait for the move input process has finished
                this.chessboard.setPosition(chess.fen(), true).then(() => {
                    // update position, maybe castled and wait for animation has finished
                    //makeEngineMove(event.chessboard)
                    //flag to change for connection
                    //board.enableMoveInput(inputHandler)
                    socket.send(JSON.stringify({
                        type: "move",
                        fen: chess.fen(),
                    }));
                    return;
                });
            });
        } else {
            // promotion?
            let possibleMoves = chess.moves({
                square: event.squareFrom,
                verbose: true,
            });
            for (const possibleMove of possibleMoves) {
                if (
                    possibleMove.promotion &&
                    possibleMove.to === event.squareTo
                ) {
                    event.chessboard.showPromotionDialog(
                        event.squareTo,
                        color,
                        (result) => {
                            console.log("promotion result", result);
                            if (result) {
                                chess.move({
                                    from: event.squareFrom,
                                    to: event.squareTo,
                                    promotion: result.piece.charAt(1),
                                });
                                event.chessboard.setPosition(chess.fen(), true);
                                //makeEngineMove(event.chessboard);
                                //flag to change for connection
                                socket.send(JSON.stringify({
                                    type: "move",
                                    fen: chess.fen(),
                                }));
                            } else {
                                // promotion canceled
                                //flag to change for connection
                                board.enableMoveInput(
                                    inputHandler, color
                                );
                                event.chessboard.setPosition(chess.fen(), true);
                            }
                        }
                    );
                    return true;
                }
            }
        }
        return result;
    } else if (event.type === INPUT_EVENT_TYPE.moveInputFinished) {
        if (event.legalMove) {
            event.chessboard.disableMoveInput();
        }
    }
}


function setSize() {
    const board = document.getElementById("boardChess");
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width > height) {
        board.style.width = height + "px";
        board.style.height = height + "px";
    } else {
        board.style.width = width + "px";
        board.style.height = width + "px";
    }
}
setSize();
window.onresize = setSize;