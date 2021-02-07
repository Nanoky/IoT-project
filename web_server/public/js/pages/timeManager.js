const serverurl = "ws://localhost:8000";

var led_time = [
    [],
    [],
    [],
    []
]

$(document).ready(function(){


});

function getYear()
{
    var year = new Date().getFullYear();
    for (let index = 0; index < 4; index++) {
        
        $.get("/led/time?id=" + (index + 1) + "&start", (data, status) => {

        });
        
    }
}