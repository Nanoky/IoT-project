const express = require("express");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const sqlite = require("sqlite3");
const logs = require("debug")("logs");
const error = require("debug")("error");

const app = express();
const client = mqtt.connect("mqtt://broker.hivemq.com");

const port = 8080;


//System params

var led_state = [false, false, false, false];
var led_on_time = [new Date().getTime(), new Date().getTime(), new Date().getTime(), new Date().getTime()];


// Web communication controller

app.use((req, res, next) => {

    logs("\nConnection received from " + req.ip + " for " + req.originalUrl);

    res.setHeader("Content-Access-Allow-Origin", "*");
    res.setHeader("Content-Access-Allow-Methods", "GET, POST");

    next();

});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded())

// Handle web client command

app.post("/led/state", (req, res, next) => {
    
    logs(req.body);
    handleLEDState(req.body.state);
    updateLEDState();

    webResponse(res, true, led_state_on, "LED state updated");

});

app.get("/led/state", (req, res, next) => {

    webResponse(res, true, led_state_on);

});

app.get("/led/time", (req, res, next) => {

    if (req.id && req.params.start && req.params.end)
    {
        ans = getLEDOnTime(req.params.start, req.params.end);

        webResponse(res, ans.success, ans.data, ans.message);
    }
});

app.use((req, res, next) => {
    webResponse(res, false, [], "404 not found");
});

app.listen(port);









// MQTT communication controller

const action_topic = "nanok/led/action";
const command_topic = "nanok/led/command";

const service_connected = "/connected";
const service_state = "/state";

var command_service_connected = false;

//Initialization of MQTT broker service handle

client.on('connect', () => {

    //console.log("MQTT client connected");
    logs("MQTT client connected");

    client.publish(action_topic + service_connected, 'true');

    client.subscribe(command_topic + service_connected);
    client.subscribe(command_topic + service_state);

});

// MQTT broker service message handle

client.on("message", (topic, message) => {

    logs("\t- Received a message from : " + topic);
    logs("\t\tMessage = " + message);

    if (topic == command_topic + service_connected)
    {
        handleCommandServiceState(message);
    }

    if (command_service_connected)
    {
        if (topic == command_topic + service_state)
        {
            //Get the state got
            handleLEDState(message);

            //Send immediatly instruction to the action unit
            updateLEDState();
        }
    }
});


// Handler function

function webResponse(res, success = true, data = [], message = "")
{
    res.json({
        success : success,
        data : data,
        message : message
    });

    res.end();
}

function updateLEDState(id)
{
    client.publish(action_topic + service_state, JSON.stringify({
        id : id,
        state : led_state[id].toString()
    }));
}

function handleLEDState(message)
{
    message = JSON.parse(message.toString());

    let last_led_state = led_state[message.id];
    led_state[message.id] = message.state;

    if (last_led_state != led_state[message.id])
    {
        led_on_time = new Date().getTime();
    }

    if (!(led_state[message.id] === 'true'))
    {
        //save end time and stored start time
        let end_time = new Date().getTime();
        saveLEDState(message.id, end_time).then((result) => {

        }).catch((err) => {
            
        });
    }
}

function handleCommandServiceState(message)
{
    command_service_connected = (message.toString() === 'true');
}








// initialization of database connection

const db = new sqlite.Database("./database/led", (err) => {
    if (err) {
        error(err);
    }

    logs("connected to database");
});


async function saveLEDState(id, end_time)
{
    var result = {
        success: false,
        data: [],
        message: err
    };

    await db.run("INSERT INTO ontime (start_time, end_time, id_led) VALUES(?, ?, ?)",
    [led_on_time[id], end_time, id], (err) => {
        
        if (err) {
            error(err);
            result.success = false;
            result.message = err;
        }

        result.success = true;
        result.message = "Time stored";
    });

    return result;
}

async function getLEDOnTime(id, start_time, end_time)
{
    var result = {
        success: false,
        data: [],
        message: err
    };

    await db.all("SELECT * FROM ontime WHERE id_led=? start_time > ? AND end_time < ?", [
        id, start_time, end_time
    ], (err, rows) => {
        
        if (err) {
            error(err);
            result.success = false;
            result.message = err;
        }

        result.success = true;
        result.message = "";
        result.data = rows;
    });

    return result;
}
