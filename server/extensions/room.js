var MAX_ACTIONS_PER_PLAYER = 2;
var MAX_MANA = 5;
var ACTION_TURN_SECONDS = 20;
var INFECTION_TURN_SECONDS = 10;
var TRAVEL_MANA_COST = 3;
var SPECIAL_MANA_COST = 5;
var MAX_ROUNDS = 20;
var WIN_RESEARCH_TARGET = 5;
var LOSE_OUTBREAK_TARGET = 6;
var DEFAULT_RESEARCH_NODE_ID = 13;

var room = null;
var gameStarted = false;
var round = 0;
var currentPhase = "lobby";
var researchNodeId = DEFAULT_RESEARCH_NODE_ID;
var researchCount = 0;
var outbreakCount = 0;
var nodeVirus = {};
var activeInfectionNodeId = -1;
var activePlayerName = "";
var EventType = null;

try {
    EventType = SFSEventType;
} catch (e) {
    try {
        EventType = Java.type("com.smartfoxserver.v2.core.SFSEventType");
    } catch (e2) {
        EventType = null;
    }
}

var EDGE_MAP = {
    1: [2, 3, 4, 10],
    2: [1, 5, 9],
    3: [1, 4, 6, 8],
    4: [1, 3, 5, 6],
    5: [2, 4],
    6: [3, 4, 7],
    7: [6, 8],
    8: [3, 7, 10, 12],
    9: [2, 10],
    10: [1, 8, 9, 11],
    11: [10],
    12: [8, 13, 16, 17, 21],
    13: [12, 14],
    14: [13, 15, 23, 24],
    15: [14, 16],
    16: [12, 15, 17],
    17: [12, 16, 19, 20],
    19: [17],
    20: [17],
    21: [12, 22],
    22: [21],
    23: [14, 24, 25],
    24: [14, 23],
    25: [23],
    26: [27],
    27: [26, 28],
    28: [27]
};

var ALL_NODE_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20,21,22,23,24,25,26,27,28];
var INITIAL_VIRUS = {3:1,6:1,8:2,10:1,12:1,14:1,17:1,23:2,25:1,27:1};

function init() {
    room = resolveRoom(null, null);
    addRequestHandler("playerAction", onPlayerAction);
    if (EventType) {
        try {
            addEventHandler(EventType.USER_VARIABLES_UPDATE, onUserVariablesUpdate);
        } catch (e1) {
            trace("Failed to register USER_VARIABLES_UPDATE handler: " + e1);
        }
        try {
            addEventHandler(EventType.USER_ENTER_ROOM, onUserEnterRoom);
        } catch (e2) {
            trace("Failed to register USER_ENTER_ROOM handler: " + e2);
        }
        try {
            addEventHandler(EventType.USER_EXIT_ROOM, onUserExitRoom);
        } catch (e3) {
            trace("Failed to register USER_EXIT_ROOM handler: " + e3);
        }
    } else {
        trace("EventType unavailable: room/user lifecycle handlers not registered");
    }
    resetBoardState();
    broadcastRoomState();
    trace("NetCrisisExtension initialized for room: " + getRoomNameSafe());
}

function ensureRoom(user) {
    if (room) {
        return room;
    }
    if (user) {
        try {
            var joinedRoom = user.getLastJoinedRoom();
            if (joinedRoom) {
                room = joinedRoom;
                return room;
            }
        } catch (e) {}
    }
    try {
        var parentRoom = getParentRoom();
        if (parentRoom) {
            room = parentRoom;
            return room;
        }
    } catch (e2) {}
    return room;
}

function destroy() {
    trace("NetCrisisExtension destroyed for room: " + getRoomNameSafe());
}

function onUserEnterRoom(event) {
    var user = event.getParameter(SFSEventParam.USER);
    room = resolveRoom(user, event) || ensureRoom(user) || room;
    if (gameStarted) {
        setPlayerDefaults(user);
        pushBoardStateTo([user]);
        sendCountdownTick(ACTION_TURN_SECONDS, [user]);
    }
}

function onUserExitRoom(event) {
    var user = event.getParameter(SFSEventParam.USER);
    room = resolveRoom(user, event) || ensureRoom(user) || room;
    if (getUsersInRoom().length === 0) {
        gameStarted = false;
        round = 0;
        currentPhase = "lobby";
        researchCount = 0;
        outbreakCount = 0;
        researchNodeId = DEFAULT_RESEARCH_NODE_ID;
        activePlayerName = "";
        resetBoardState();
        broadcastRoomState();
    } else if (gameStarted) {
        ensureActivePlayer();
        setRoomVars([new SFSRoomVariable("activePlayerName", activePlayerName)]);
    }
}

function onUserVariablesUpdate(event) {
    var user = event.getParameter(SFSEventParam.USER);
    room = resolveRoom(user, event) || ensureRoom(user) || room;
    if (!gameStarted && areAllPlayersReady()) {
        sendToRoom("startGame", new SFSObject());
        beginGame();
    }
}

function beginGame() {
    if (gameStarted) {
        return;
    }
    gameStarted = true;
    round = 1;
    currentPhase = "action";
    researchCount = 0;
    outbreakCount = 0;
    activeInfectionNodeId = -1;
    researchNodeId = DEFAULT_RESEARCH_NODE_ID;
    resetBoardState();
    var users = getUsersInRoom();
    if (!room && users.length > 0) {
        room = ensureRoom(users[0]) || room;
    }
    if (!room) {
        trace("beginGame aborted: room is not resolved");
        return;
    }
    for (var i = 0; i < users.length; i++) {
        setPlayerDefaults(users[i]);
    }
    activePlayerName = users.length > 0 ? getUserName(users[0]) : "";
    broadcastRoomState();
    pushBoardStateTo(users);
    sendCountdownTick(ACTION_TURN_SECONDS, users);
}

function onPlayerAction(params, sender) {
    try {
        room = resolveRoom(sender, null) || ensureRoom(sender) || room;
        var actionType = params.getUtfString("type");
        if (!room || !gameStarted || currentPhase !== "action") {
            return;
        }
        if (!isSenderTurn(sender)) {
            return;
        }
        if (!consumeAction(sender)) {
            return;
        }
        var targetNodeId = readTargetNodeId(params);
        if (actionType === "move") {
            resolveMove(sender, targetNodeId, false);
        } else if (actionType === "travel") {
            resolveMove(sender, targetNodeId, true);
        } else if (actionType === "treat") {
            resolveTreat(sender, targetNodeId, "treatResolve", 0, false);
        } else if (actionType === "cleanse") {
            resolveTreat(sender, targetNodeId, "cleanseResolve", SPECIAL_MANA_COST, false);
        } else if (actionType === "bulldoze") {
            resolveTreat(sender, targetNodeId, "bulldozeResolve", SPECIAL_MANA_COST, true);
        } else if (actionType === "research") {
            resolveResearch(sender, targetNodeId);
        } else if (actionType === "charge") {
            resolveCharge(sender);
        }
        if (getUserInt(sender, "actionCount", 0) >= MAX_ACTIONS_PER_PLAYER) {
            endTurn(sender);
        }
    } catch (err) {
        trace("onPlayerAction error: " + err);
    }
}

function resolveMove(sender, targetNodeId, consumesMana) {
    var currentNodeId = getUserInt(sender, "nodePid", 1);
    if (targetNodeId <= 0) {
        return;
    }
    if (!consumesMana && !isConnected(currentNodeId, targetNodeId)) {
        return;
    }
    var vars = [
        new SFSUserVariable("previousNodePid", currentNodeId),
        new SFSUserVariable("nodePid", targetNodeId)
    ];
    if (consumesMana) {
        vars.push(new SFSUserVariable("mana", Math.max(0, getUserInt(sender, "mana", 0) - TRAVEL_MANA_COST)));
    }
    setUserState(sender, vars);
}

function resolveTreat(sender, targetNodeId, cmd, manaCost, clearAll) {
    if (targetNodeId <= 0) {
        targetNodeId = getUserInt(sender, "nodePid", 1);
    }
    var current = getNodeVirus(targetNodeId);
    var next = clearAll ? 0 : Math.max(0, current - 1);
    if (cmd === "cleanseResolve") {
        next = Math.max(0, current - 2);
    }
    if (current > 0) {
        awardPoints(sender, 50);
    }
    setNodeVirus(targetNodeId, next);
    setRoomVars([new SFSRoomVariable("boardState", createBoardStateArray())]);
    if (manaCost > 0) {
        setUserState(sender, [new SFSUserVariable("mana", Math.max(0, getUserInt(sender, "mana", 0) - manaCost))]);
    }
    var response = new SFSObject();
    response.putInt("targetNodeId", targetNodeId);
    response.putInt("virusCount", next);
    sendToRoom(cmd, response);
}

function resolveResearch(sender, targetNodeId) {
    var nodeId = targetNodeId > 0 ? targetNodeId : getUserInt(sender, "nodePid", 1);
    if (nodeId !== researchNodeId) {
        return;
    }
    researchCount += 1;
    awardPoints(sender, 100);
    researchNodeId = pickRandomNode(researchNodeId);
    setRoomVars([
        new SFSRoomVariable("researchCount", researchCount),
        new SFSRoomVariable("researchNodeId", researchNodeId)
    ]);
    setUserState(sender, [new SFSUserVariable("promoteCount", getUserInt(sender, "promoteCount", 0) + 1)]);
    if (researchCount >= WIN_RESEARCH_TARGET) {
        sendToRoom("gameWon", createGameResultPayload());
        gameStarted = false;
    }
}

function resolveCharge(sender) {
    var mana = Math.min(MAX_MANA, getUserInt(sender, "mana", 0) + 1);
    setUserState(sender, [new SFSUserVariable("mana", mana)]);
}

function endTurn(sender) {
    currentPhase = "infection";
    setRoomVars([new SFSRoomVariable("phase", currentPhase)]);
    sendCountdownTick(INFECTION_TURN_SECONDS, getUsersInRoom());
    infectSingleSourceNode();

    if (round >= MAX_ROUNDS) {
        sendToRoom("gameLost", createGameResultPayload());
        gameStarted = false;
        return;
    }

    currentPhase = "action";
    round += 1;
    advanceActivePlayer();
    setRoomVars([
        new SFSRoomVariable("phase", currentPhase),
        new SFSRoomVariable("round", round),
        new SFSRoomVariable("activePlayerName", activePlayerName)
    ]);
    sendCountdownTick(ACTION_TURN_SECONDS, getUsersInRoom());
}

function consumeAction(sender) {
    var current = getUserInt(sender, "actionCount", 0);
    if (current >= MAX_ACTIONS_PER_PLAYER) {
        return false;
    }
    setUserState(sender, [new SFSUserVariable("actionCount", current + 1)]);
    return true;
}

function infectSingleSourceNode() {
    var nodeId = pickSpreadNode();
    var virusCount = getNodeVirus(nodeId) + 1;
    if (virusCount > 3) {
        outbreakCount += 1;
        virusCount = 3;
        var outbreak = new SFSObject();
        outbreak.putInt("nodeId", nodeId);
        outbreak.putInt("outbreakCount", outbreakCount);
        sendToRoom("outbreak", outbreak);
    }
    setNodeVirus(nodeId, virusCount);
    activeInfectionNodeId = nodeId;
    setRoomVars([new SFSRoomVariable("boardState", createBoardStateArray())]);
    var infect = new SFSObject();
    infect.putInt("nodeId", nodeId);
    infect.putInt("virusCount", virusCount);
    sendToRoom("infect", infect);
    if (outbreakCount >= LOSE_OUTBREAK_TARGET) {
        sendToRoom("gameLost", createGameResultPayload());
        gameStarted = false;
    }
}

function pickSpreadNode() {
    var source = activeInfectionNodeId;
    if (source <= 0 || getNodeVirus(source) <= 0) {
        source = findInitialInfectionSource();
    }

    if (source <= 0) {
        source = ALL_NODE_IDS[0];
    }

    var neighbors = EDGE_MAP[source] || [];
    if (neighbors.length === 0) {
        return source;
    }

    var target = neighbors[0];
    var minVirus = getNodeVirus(target);
    for (var i = 1; i < neighbors.length; i++) {
        var candidate = neighbors[i];
        var count = getNodeVirus(candidate);
        if (count < minVirus) {
            minVirus = count;
            target = candidate;
        }
    }

    return target;
}

function findInitialInfectionSource() {
    for (var i = 0; i < ALL_NODE_IDS.length; i++) {
        var nodeId = ALL_NODE_IDS[i];
        if (getNodeVirus(nodeId) > 0) {
            return nodeId;
        }
    }
    return -1;
}

function broadcastRoomState() {
    setRoomVars([
        new SFSRoomVariable("phase", currentPhase),
        new SFSRoomVariable("round", round),
        new SFSRoomVariable("researchNodeId", researchNodeId),
        new SFSRoomVariable("researchCount", researchCount),
        new SFSRoomVariable("activePlayerName", activePlayerName),
        new SFSRoomVariable("boardState", createBoardStateArray())
    ]);
}

function pushBoardStateTo(recipients) {
    for (var i = 0; i < ALL_NODE_IDS.length; i++) {
        var nodeId = ALL_NODE_IDS[i];
        var virusCount = getNodeVirus(nodeId);
        if (virusCount > 0) {
            var infect = new SFSObject();
            infect.putInt("nodeId", nodeId);
            infect.putInt("virusCount", virusCount);
            send("infect", infect, recipients);
        }
    }
}

function resetBoardState() {
    nodeVirus = {};
    for (var i = 0; i < ALL_NODE_IDS.length; i++) {
        nodeVirus[ALL_NODE_IDS[i]] = 0;
    }
    for (var key in INITIAL_VIRUS) {
        if (INITIAL_VIRUS.hasOwnProperty(key)) {
            nodeVirus[parseInt(key, 10)] = INITIAL_VIRUS[key];
        }
    }
}

function createBoardStateArray() {
    var boardState = new SFSArray();
    for (var i = 0; i < ALL_NODE_IDS.length; i++) {
        var nodeState = new SFSObject();
        nodeState.putInt("virusCount", getNodeVirus(ALL_NODE_IDS[i]));
        boardState.addSFSObject(nodeState);
    }
    return boardState;
}

function setPlayerDefaults(user) {
    setUserState(user, [
        new SFSUserVariable("isInGame", true),
        new SFSUserVariable("previousNodePid", 1),
        new SFSUserVariable("nodePid", 1),
        new SFSUserVariable("actionCount", 0),
        new SFSUserVariable("mana", 0),
        new SFSUserVariable("promoteCount", 0),
        new SFSUserVariable("points", 0)
    ]);
}

function readTargetNodeId(params) {
    try {
        return params.getInt("targetNodeId");
    } catch (e) {
        return -1;
    }
}

function getUsersInRoom() {
    if (!room) {
        return [];
    }
    return toArray(room.getUserList());
}

function getUserName(user) {
    try {
        return user.getName();
    } catch (e) {
        return user && user.name ? user.name : "";
    }
}

function ensureActivePlayer() {
    var users = getUsersInRoom();
    if (users.length === 0) {
        activePlayerName = "";
        return;
    }

    if (!activePlayerName) {
        activePlayerName = getUserName(users[0]);
        return;
    }

    for (var i = 0; i < users.length; i++) {
        if (getUserName(users[i]) === activePlayerName) {
            return;
        }
    }

    activePlayerName = getUserName(users[0]);
}

function isSenderTurn(sender) {
    ensureActivePlayer();
    return getUserName(sender) === activePlayerName;
}

function advanceActivePlayer() {
    var users = getUsersInRoom();
    if (users.length === 0) {
        activePlayerName = "";
        return;
    }

    var currentIndex = -1;
    for (var i = 0; i < users.length; i++) {
        if (getUserName(users[i]) === activePlayerName) {
            currentIndex = i;
            break;
        }
    }

    var nextIndex = currentIndex >= 0 ? (currentIndex + 1) % users.length : 0;
    activePlayerName = getUserName(users[nextIndex]);
    setUserState(users[nextIndex], [new SFSUserVariable("actionCount", 0)]);
}

function areAllPlayersReady() {
    var users = getUsersInRoom();
    if (users.length === 0) {
        return false;
    }
    for (var i = 0; i < users.length; i++) {
        if (!isReadyUser(users[i])) {
            return false;
        }
    }
    return true;
}

function isReadyUser(user) {
    var ready = getVariableValue(user, "isReady", false);
    return ready === true || ready === "true" || ready === 1 || ready === "1";
}

function isConnected(a, b) {
    var list = EDGE_MAP[a] || [];
    for (var i = 0; i < list.length; i++) {
        if (list[i] === b) {
            return true;
        }
    }
    return false;
}

function pickRandomNode(excludeNodeId) {
    var candidates = [];
    for (var i = 0; i < ALL_NODE_IDS.length; i++) {
        if (ALL_NODE_IDS[i] !== excludeNodeId) {
            candidates.push(ALL_NODE_IDS[i]);
        }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function getNodeVirus(nodeId) {
    return nodeVirus[nodeId] || 0;
}

function setNodeVirus(nodeId, count) {
    nodeVirus[nodeId] = Math.max(0, count);
}

function awardPoints(user, amount) {
    var current = getUserInt(user, "points", 0);
    setUserState(user, [new SFSUserVariable("points", current + amount)]);
}

function createGameResultPayload() {
    var payload = new SFSObject();
    payload.putSFSArray("scores", createScoreArray());
    return payload;
}

function createScoreArray() {
    var users = getUsersInRoom();
    var scores = new SFSArray();
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var item = new SFSObject();
        item.putUtfString("name", getUserName(user));
        item.putInt("points", getUserInt(user, "points", 0));
        scores.addSFSObject(item);
    }
    return scores;
}

function getVariableValue(entity, varName, fallback) {
    var variable = entity.getVariable(varName);
    if (variable == null) {
        return fallback;
    }
    try {
        return variable.getValue();
    } catch (e) {
        if (variable.value !== undefined) {
            return variable.value;
        }
        return fallback;
    }
}

function getUserInt(user, name, fallback) {
    var variable = user.getVariable(name);
    if (variable == null) {
        return fallback;
    }
    try {
        return variable.getIntValue();
    } catch (e) {
        return parseInt(getVariableValue(user, name, fallback), 10);
    }
}

function setUserState(user, vars) {
    getApi().setUserVariables(user, vars, true);
}

function setRoomVars(vars) {
    if (!room) {
        trace("setRoomVars skipped: room is not resolved");
        return;
    }
    getApi().setRoomVariables(null, room, vars, true);
}

function sendToRoom(cmd, params) {
    var recipients = getUsersInRoom();
    if (recipients.length === 0) {
        trace("sendToRoom: no recipients for cmd: " + cmd);
        return;
    }
    trace("sendToRoom: sending " + cmd + " to " + recipients.length + " users");
    send(cmd, params || new SFSObject(), recipients);
}

function sendCountdownTick(seconds, recipients) {
    var targets = recipients || getUsersInRoom();
    if (!targets || targets.length === 0) {
        trace("sendCountdownTick: no recipients");
        return;
    }
    trace("sendCountdownTick: sending " + seconds + " seconds for phase: " + currentPhase + " to " + targets.length + " users");
    var params = new SFSObject();
    params.putInt("remaining", seconds);
    params.putUtfString("phase", currentPhase);
    send("countdownTick", params, targets);
}

function resolveRoom(user, event) {
    try {
        var parentRoom = getParentRoom();
        if (parentRoom) {
            return parentRoom;
        }
    } catch (e) {}

    if (event) {
        try {
            var eventRoom = event.getParameter(SFSEventParam.ROOM);
            if (eventRoom) {
                return eventRoom;
            }
        } catch (e2) {}
    }

    if (user) {
        try {
            var joinedRoom = user.getLastJoinedRoom();
            if (joinedRoom) {
                return joinedRoom;
            }
        } catch (e3) {}
    }

    return room;
}

function getRoomNameSafe() {
    return room ? room.getName() : "<unbound>";
}

function toArray(javaList) {
    var result = [];
    for (var i = 0; i < javaList.size(); i++) {
        result.push(javaList.get(i));
    }
    return result;
}
