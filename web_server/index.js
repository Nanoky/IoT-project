const express = require("express");
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const sqlite = require("sqlite3");
const logs = require("debug")("logs");
const error = require("debug")("error");
const compression = require("compression");



const app = express();
const client = mqtt.connect("mqtt://broker.hivemq.com");

const port = 8080;


//System params

var led_state = ['false', 'false', 'false', 'false'];
var led_on_time = [0, 0, 0, 0];


// Web communication controller



// Setting views configurations

app.set("views", "./views");
app.set("view engine", "ejs");

// Routes and request configuration 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded())
app.use(compression());


app.use((req, res, next) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");

    next();

});

// Handle web client command

app.get("/", (req, res, next) => {

    res.render("home/index.ejs", {
        states : led_state
    });
    res.end();

});

app.use(express.static("public"));

app.post("/led/state", (req, res, next) => {
    
    logs(req.body);
    handleLEDState('{"id":"' + req.body.id + '","state":"' + req.body.state + '"}');
    updateLEDState(req.body.id);

    webResponse(res, true, led_state[req.body.id], "LED state updated");

});

app.get("/led/state", (req, res, next) => {

    webResponse(res, true, led_state);

});

app.get("/led/time/hour", (req, res, next) => {

    if (req.query.id && req.query.start)
    {
        let year = new Date().getFullYear();
        let month = new Date().getMonth();
        let day = new Date().getDate();
        let start = new Date(year, month, day, req.query.start, 0, 0, 0).getTime();
        let end = new Date(year, month, day, req.query.start, 59, 59, 0).getTime();
        getLEDOnDate(res, req.query.id, start, end);
    }
});

app.get("/led/time/month", (req, res, next) => {

    if (req.query.id && req.query.start)
    {
        let year = new Date().getFullYear();
        let start = new Date(year, req.query.start, 1, 0, 0, 0, 0).getTime();
        let end = new Date(year, req.query.start, 23, 59, 59, 0).getTime();
        getLEDOnDate(res, req.query.id, start, end);
    }
});

app.get("/led/time/week", (req, res, next) => {

    if (req.query.id && req.query.start)
    {
        let year = new Date().getFullYear();
        let month = new Date().getMonth();
        let start = new Date(year, month, req.query.start, 0, 0, 0, 0).getTime();
        let end = new Date(year, month, req.query.start + 6, 23, 59, 59, 0).getTime();
        getLEDOnDate(res, req.query.id, start, end);
    }
});

app.get("/led/time/day", (req, res, next) => {

    if (req.query.id && req.query.start)
    {
        let year = new Date().getFullYear();
        let month = new Date().getMonth();
        let start = new Date(year, month, req.query.start, 0, 0, 0, 0).getTime();
        let end = new Date(year, month, req.query.start, 23, 59, 59, 0).getTime();
        getLEDOnDate(res, req.query.id, start, end);
    }
});

app.get("/led/time", (req, res, next) => {

    if (req.query.id)
    {

        var result = {
            success: false,
            data: [],
            message: ""
        };

        var last_state = led_on_time[req.query.id];
    
        db.all("SELECT SUM(end_time - start_time) as time FROM ontime WHERE id_led=?", [
            Number(req.query.id) + 1
        ], (err, rows) => {
            
            if (err) {
                error(err);
                result.success = false;
                result.message = err;
            }
    
            result.success = true;
            result.message = "";
            result.data = rows[0];

            if (led_state === 'on' || led_state === 'true'){
                result.data.time = result.data.time + (new Date().getTime() - last_state);
            }

            webResponse(res, result.success, result.data, result.message);
        });
    }
});

app.use((req, res, next) => {
    webResponse(res, false, [], "404 not found");
});

app.listen(port);









// MQTT communication controller

const action_topic = "stic/raspberry/domo/wemos";
const command_topic = "stic/raspberry/domo/esp32";

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
            let id = handleLEDState(message);

            //Send immediatly instruction to the action unit
            updateLEDState(id);
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
    let state = (led_state[id] === 'true' || led_state[id] === 'on') ? 1 : 0;
    var data = String(Number(id)) + state;
    logs(data);
    client.publish(action_topic + service_state, data);
}

function handleLEDState(message)
{
    message = JSON.parse(message.toString());

    let last_led_state = led_state[message.id];
    led_state[message.id] = message.state;

    if (last_led_state != led_state[message.id])
    {
        if (led_state[message.id] === 'true' || led_state[message.id] === 'on')
        {
            led_on_time[message.id] = new Date().getTime();
        }

        if (!(led_state[message.id] === 'true' || led_state[message.id] === 'on'))
        {
            //save end time and stored start time
            let end_time = new Date().getTime();
            saveLEDState(message.id, end_time).then((result) => {
                logs(result);
            }).catch((err) => {
                error(err);
            });
        }
    }

    logs(led_state);

    return message.id;
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
        message: ""
    };

    await db.run("INSERT INTO ontime (start_time, end_time, id_led) VALUES(?, ?, ?)",
    [led_on_time[id], end_time, Number(id) + 1], (err) => {
        
        if (err) {
            error(err);
            result.success = false;
            result.message = err;
        }

        result.success = true;
        result.message = "Time stored";

        led_on_time[id] = 0;

        return result;
    });

}

function getLEDOnDate(res, id, start_time, end_time)
{
    var result = {
        success: false,
        data: [],
        message: ""
    };

    db.all("SELECT COUNT(id) as time FROM ontime WHERE id_led=? AND start_time > ? AND end_time < ?", [
        id, start_time, end_time
    ], (err, rows) => {
        
        if (err) {
            error(err);
            result.success = false;
            result.message = err;
        }

        result.success = true;
        result.message = "";
        result.data = rows[0];

        if (led_on_time[id] != 0 && led_on_time[id] != "0"){
            result.data.time = result.data.time + 1;
        }

        webResponse(res, result.success, result.data, result.message);
    });

}
