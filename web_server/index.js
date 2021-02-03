const express = require("express");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const sqlite = require("sqlite3");

const app = express();
const client = mqtt.connect("mqtt://broker.hivemq.com");

const port = 8080;

// initialization of database connection

const db = new sqlite.Database("./database/led", (err) => {
    if (err) {
        console.error(err);
    }

    console.log("connected to database");
});


//System params

var led_state_on = false;
var led_on_time = new Date().getTime();


// MQTT communication controller

const action_topic = "nanok/led/action";
const command_topic = "nanok/led/command";

const service_connected = "/connected";
const service_state = "/state";

var command_service_connected = false;

//Initialization of MQTT broker service handle

client.on('connect', () => {

    console.log("MQTT client connected");

    client.publish(action_topic + service_connected, 'true');

    client.subscribe(command_topic + service_connected);
    client.subscribe(command_topic + service_state);

});

// MQTT broker service message handle

client.on("message", (topic, message) => {

    console.log("\t- Received a message from : " + topic);
    console.log("\t\tMessage = " + message);

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


// Web communication controller

app.use((req, res, next) => {

    res.setHeader("Content-Access-Allow-Origin", "*");
    res.setHeader("Content-Access-Allow-Methods", "GET, POST");

});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded())

// Handle web client command

app.post("/led/state", (req, res, next) => {
    
    handleLEDState(res.body);
    updateLEDState();

    webResponse(res, true, led_state_on, "LED state updated");

});

app.get("/led/state", (req, res, next) => {

    webResponse(res, true, led_state_on);

});

app.get("/led/time", (req, res, next) => {

    if (req.params.start && req.params.end)
    {
        ans = getLEDOnTime(req.params.start, req.params.end);

        webResponse(res, ans.success, ans.data, ans.message);
    }
});

app.use((req, res, next) => {
    webResponse(res, false, [], "404 not found");
});

app.listen(port);


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

function updateLEDState()
{
    client.publish(action_topic + service_state, led_state_on.toString());
}

function handleLEDState(message)
{
    let last_led_state = led_state_on;
    led_state_on = (message.toString() === 'true');

    if (last_led_state != led_state_on && led_state_on)
    {
        led_on_time = new Date().getTime();
    }

    if (!led_state_on)
    {
        //save end time and stored start time
        let end_time = new Date().getTime();
        saveLEDState(end_time);

    }
}

function handleCommandServiceState(message)
{
    command_service_connected = (message.toString() === 'true');
}

function saveLEDState(end_time)
{
    db.run("INSERT INTO ontime (start_time, end_time) VALUES(?, ?)",
    [led_on_time, end_time], (err) => {
        
        if (err) {
            console.error(err);
            return {
                success: false,
                message: err
            }
        }

        return {
            success: true,
            message: "Time stored"
        }
    });
}

function getLEDOnTime(start_time, end_time)
{
    db.all("SELECT * FROM ontime WHERE start_time > ? AND end_time < ?", (err, rows) => {
        
        if (err) {
            console.error(err);
            return {
                success: false,
                data: [],
                message: err
            }
        }

        return {
            success: true,
            message: "Time retrieved",
            data: rows
        }
    });
}
