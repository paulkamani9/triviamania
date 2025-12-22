/**
 * Socket.io Load Test Script
 *
 * Simulates multiple rooms with concurrent players to test server performance.
 *
 * Usage:
 *   node tests/load-test.js [options]
 *
 * Options:
 *   --rooms=N      Number of concurrent rooms (default: 5)
 *   --players=N    Players per room (default: 4)
 *   --url=URL      Server URL (default: http://localhost:3000)
 *   --duration=N   Test duration in seconds (default: 60)
 */

import { io } from "socket.io-client";

// Parse CLI arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace("--", "").split("=");
  acc[key] = value;
  return acc;
}, {});

const CONFIG = {
  serverUrl: args.url || "http://localhost:3000",
  numRooms: parseInt(args.rooms || "5", 10),
  playersPerRoom: parseInt(args.players || "4", 10),
  testDuration: parseInt(args.duration || "60", 10) * 1000,
};

const stats = {
  roomsCreated: 0,
  playersJoined: 0,
  gamesStarted: 0,
  answersSubmitted: 0,
  reconnects: 0,
  errors: 0,
  latencies: [],
};

function generateUserId() {
  return `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUsername() {
  const adjectives = ["Quick", "Sleepy", "Happy", "Brave", "Clever"];
  const nouns = ["Fox", "Bear", "Cat", "Dog", "Wolf"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

async function createPlayer(roomCode, isLeader = false) {
  return new Promise((resolve, reject) => {
    const socket = io(CONFIG.serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    const userId = generateUserId();
    const username = generateUsername();
    let resolved = false;

    socket.on("connect", () => {
      const startTime = Date.now();

      if (isLeader) {
        socket.emit("create-room", { userId, username });

        socket.on("room-created", (data) => {
          stats.roomsCreated++;
          stats.latencies.push(Date.now() - startTime);
          if (!resolved) {
            resolved = true;
            resolve({
              socket,
              roomCode: data.roomCode,
              userId,
              username,
              isLeader: true,
            });
          }
        });
      } else {
        socket.emit("join-room", { roomCode, userId, username });

        socket.on("room-state", () => {
          stats.playersJoined++;
          stats.latencies.push(Date.now() - startTime);
          if (!resolved) {
            resolved = true;
            resolve({ socket, roomCode, userId, username, isLeader: false });
          }
        });
      }
    });

    socket.on("connect_error", (error) => {
      stats.errors++;
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    });

    socket.on("error", (data) => {
      stats.errors++;
      console.error(`Socket error: ${data.message}`);
    });

    // Timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error("Connection timeout"));
      }
    }, 10000);
  });
}

async function simulateGame(leader, players) {
  return new Promise((resolve) => {
    // Leader starts game
    leader.socket.emit("start-game", {
      roomCode: leader.roomCode,
      category: null,
      difficulty: null,
    });

    // Handle questions
    const allSockets = [leader, ...players];
    let questionsAnswered = 0;
    let gameEnded = false;

    allSockets.forEach(({ socket, userId, roomCode }) => {
      socket.on("question", (data) => {
        // Simulate thinking time (1-5 seconds)
        const delay = 1000 + Math.random() * 4000;
        setTimeout(() => {
          if (!gameEnded) {
            const randomAnswer =
              data.choices[Math.floor(Math.random() * data.choices.length)];
            const startTime = Date.now();
            socket.emit("submit-answer", {
              roomCode,
              userId,
              questionIndex: data.index,
              answer: randomAnswer,
            });
            stats.answersSubmitted++;
          }
        }, delay);
      });

      socket.on("game-over", () => {
        gameEnded = true;
      });
    });

    // Game started
    leader.socket.on("game-starting", () => {
      stats.gamesStarted++;
    });

    // End after game duration or timeout
    setTimeout(() => {
      resolve();
    }, 60000); // 60s max per game
  });
}

async function simulateReconnect(player) {
  const { socket, roomCode, userId, username } = player;

  // Disconnect
  socket.disconnect();

  // Wait random time (1-5 seconds)
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 4000));

  // Reconnect
  return new Promise((resolve) => {
    const newSocket = io(CONFIG.serverUrl, { autoConnect: true });

    newSocket.on("connect", () => {
      newSocket.emit("join-room", { roomCode, userId, username });
    });

    newSocket.on("room-state", () => {
      stats.reconnects++;
      resolve({ ...player, socket: newSocket });
    });

    newSocket.on("error", () => {
      resolve(null); // Reconnect failed (grace period expired)
    });

    setTimeout(() => resolve(null), 10000);
  });
}

async function runRoom(roomIndex) {
  console.log(`  Room ${roomIndex + 1}: Creating...`);

  try {
    // Create leader
    const leader = await createPlayer(null, true);
    console.log(
      `  Room ${roomIndex + 1}: Created with code ${leader.roomCode}`
    );

    // Join players
    const players = [];
    for (let i = 1; i < CONFIG.playersPerRoom; i++) {
      try {
        const player = await createPlayer(leader.roomCode, false);
        players.push(player);
      } catch (err) {
        console.error(`  Room ${roomIndex + 1}: Player ${i} failed to join`);
        stats.errors++;
      }
    }

    console.log(`  Room ${roomIndex + 1}: ${players.length + 1} players ready`);

    // Start game
    await simulateGame(leader, players);

    // Cleanup
    [leader, ...players].forEach(({ socket }) => socket.disconnect());

    console.log(`  Room ${roomIndex + 1}: Completed`);
  } catch (err) {
    console.error(`  Room ${roomIndex + 1}: Failed - ${err.message}`);
    stats.errors++;
  }
}

async function runLoadTest() {
  console.log("🧪 Starting Socket.io Load Test");
  console.log(`   Server: ${CONFIG.serverUrl}`);
  console.log(`   Rooms: ${CONFIG.numRooms}`);
  console.log(`   Players per room: ${CONFIG.playersPerRoom}`);
  console.log(`   Duration: ${CONFIG.testDuration / 1000}s`);
  console.log("");

  const startTime = Date.now();

  // Run rooms concurrently
  const roomPromises = [];
  for (let i = 0; i < CONFIG.numRooms; i++) {
    // Stagger room creation to avoid thundering herd
    await new Promise((r) => setTimeout(r, 500));
    roomPromises.push(runRoom(i));
  }

  // Wait for all rooms or timeout
  await Promise.race([
    Promise.all(roomPromises),
    new Promise((r) => setTimeout(r, CONFIG.testDuration)),
  ]);

  const duration = (Date.now() - startTime) / 1000;

  // Print results
  console.log("");
  console.log("📊 Load Test Results");
  console.log("═".repeat(40));
  console.log(`   Duration: ${duration.toFixed(1)}s`);
  console.log(`   Rooms created: ${stats.roomsCreated}`);
  console.log(`   Players joined: ${stats.playersJoined}`);
  console.log(`   Games started: ${stats.gamesStarted}`);
  console.log(`   Answers submitted: ${stats.answersSubmitted}`);
  console.log(`   Reconnects: ${stats.reconnects}`);
  console.log(`   Errors: ${stats.errors}`);

  if (stats.latencies.length > 0) {
    const avgLatency =
      stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length;
    const maxLatency = Math.max(...stats.latencies);
    const minLatency = Math.min(...stats.latencies);
    console.log(
      `   Latency (avg/min/max): ${avgLatency.toFixed(
        0
      )}ms / ${minLatency}ms / ${maxLatency}ms`
    );
  }

  console.log("");

  const success = stats.errors === 0 && stats.roomsCreated === CONFIG.numRooms;
  if (success) {
    console.log("✅ Load test PASSED");
  } else {
    console.log("❌ Load test FAILED");
    process.exit(1);
  }
}

runLoadTest().catch((err) => {
  console.error("Load test error:", err);
  process.exit(1);
});
