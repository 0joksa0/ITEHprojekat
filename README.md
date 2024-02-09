# Chess Game with Node.js and Socket.IO

Welcome to the Chess Game project! This is a multiplayer chess game implemented in Node.js using the Socket.IO library. Players can enjoy real-time gameplay with advanced chess features through a web browser interface.

## Features

- Real-time multiplayer gameplay with two players.
- Complete set of chess rules and legal moves.
- Special moves supported: en passant, castling, and pawn promotion.
- Interactive highlighting of legal moves for each piece.
- Automatic detection of checkmate and stalemate conditions.
- User account management with login and sign-up functionality.
- User statistics tracking for gameplay analysis.
- Chess engine integration for playing against a bot (future enhancement).
- Multiple game modes, including various time controls (e.g., 5 minutes, blitz, etc.).
- Simple and intuitive user interface.

## Requirements

To run the Chess Game, you need to have the following software installed:

- Node.js (version 10 or higher)

## Installation

To get started with the Chess Game, follow these steps:

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/0joksa0/ITEHprojekat.git
   ```

2. Navigate to the project directory:

   ```bash
   cd ITEHprojekat
   ```

3. Install the project dependencies using npm:

   ```bash
   npm install
   ```

## Usage

To launch the Chess Game, execute the following command:

```bash
node ws-server.js
```

Once the server is running, open your web browser and visit `http://localhost:3001` to access the game.

Upon accessing the game, you have the option to sign up for a new account or log in if you already have an account. After logging in, two players can join the game and start playing against each other in real time.

## Project Structure

The Chess Game project has the following structure:

- `app.js`: The main server file responsible for managing game state, enforcing rules, and handling communication with clients.
- `public/`: Contains the client-side JavaScript, CSS, and HTML files for the user interface.
- `src/`: Includes additional server-side logic and utilities for the game.
- `models/`: Holds the database-related files, such as models and connection configurations.

## User Statistics

The game utilizes a MongoDB database for user account management. You can leverage this database to store and track user statistics. By extending the existing database models, you can add fields for statistics such as the number of games played, wins, losses, and draw ratios. Storing this information will allow you to retrieve and display user statistics within the game interface.

## Chess Engine Integration (Future Enhancement)

In addition to user statistics, you have expressed interest in integrating a chess engine to allow players to play against a bot. This enhancement will provide a challenging experience for players. There are various chess engine libraries available in Node.js, such as Stockfish or Chess.js AI, that you can leverage for this purpose. By creating a new game mode, players can choose to play against the bot, and the chess engine can handle the moves for the bot player based on the game's current state.

## Game Modes

The Chess Game offers various game modes to cater to different preferences and time constraints. Alongside the default mode, you can expect additional modes, including different time controls. These may include modes like 5 minutes, blitz, rapid, and more. Each mode will have its own time restrictions to provide players with a variety of gameplay options.

## Contributing

Contributions are welcome! If you have any suggestions, find a bug, or want to add new features, feel free to open an issue or submit a pull request. We appreciate your involvement in improving the Chess

 Game.

## Contact

If you have any questions or need assistance with the Chess Game, please feel free to reach out. We value your feedback and are here to help!
