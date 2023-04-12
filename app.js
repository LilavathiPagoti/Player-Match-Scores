const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertDbObjectToResponseObjectMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//api 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
     player_details;`;
  const playerArray = await database.all(getPlayerQuery);
  response.send(
    playerArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    
    SELECT * FROM  player_details 
    WHERE player_id=${playerId};
    
    `;
  const player = await database.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});
//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerName = `
    UPDATE  player_details SET
    player_name='${playerName}'
   ;
    
    `;
  await database.run(updatePlayerName);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    
    SELECT * FROM  match_details 
    WHERE match_id=${matchId};
    
    `;
  const match = await database.get(getMatchQuery);
  response.send(convertDbObjectToResponseObjectMatch(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatcherQuery = `
    SELECT
    *
    FROM
       player_match_score
       NATURAL JOIN match_details
    WHERE
        player_id = ${playerId};`;
  const matchArray = await database.all(getPlayerMatcherQuery);
  response.send(
    matchArray.map((eachMatch) =>
      convertDbObjectToResponseObjectMatch(eachMatch)
    )
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      *
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerArray = await database.all(getMatchPlayersQuery);
  response.send(
    playerArray.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playersArray = await database.all(getMatchPlayerQuery);
  response.send(playersArray);
});
module.exports = app;
