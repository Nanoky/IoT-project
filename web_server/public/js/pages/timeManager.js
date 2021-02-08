//const serverurl = "http://localhost:8080";

var led_time = {
    year: [0, 0, 0, 0],
    month: [0, 0, 0, 0],
    week: [0, 0, 0, 0],
    day: [0, 0, 0, 0]
};

const daily = 1;
const weekly = 2;
const monthly = 2;
const annualy = 3;

const red = 0;
const green = 1;
const blue = 2;
const yellow = 3;

const day_label = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24'];
const week_label = ['0','1','2','3','4','5','6','7'];
const month_label = ['0','1','2','3','4'];
const year_label = ['0','1','2','3','4','5','6','7','8','9','10','11','12'];

var current_state = ["OFF", "OFF", "OFF", "OFF"];
var current_stat = daily;
var current_label = day_label;
var graph_data = {
    day: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    week: [
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
    ],
    month: [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
    ],
    year: [
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
    ]
};
var current_data = graph_data.day;

var current_graph = [];

var chart = null;

$(document).ready(function(){

    $("#stat_frequency").html("Daily");

    getUpdate();
    setupGraph();

    $("#daily-stat_button").click(() => {
        current_stat = daily;
        $("#stat_frequency").html("Daily");
    });

    $("#weekly-stat_button").click(() => {
        current_stat = weekly;
        $("#stat_frequency").html("Weekly");
    });

    $("#monthly-stat_button").click(() => {
        current_stat = monthly;
        $("#stat_frequency").html("Month");
    });

    $("#annualy-stat_button").click(() => {
        current_stat = annualy;
        $("#stat_frequency").html("Annualy");
    });

    $("#blue_box").click(() => {
        if (current_state[blue] == "ON")
        {
            $("#blue_icon").html("<i class='far fa-lightbulb'></i>");
            setState(blue, "off");
        }
        else
        {
            $("#blue_icon").html("<i class='fas fa-lightbulb'></i>");
            setState(blue, "on");
        }
    });

    $("#red_box").click(() => {
        if (current_state[red] == "ON")
        {
            $("#red_icon").html("<i class='far fa-lightbulb'></i>");
            setState(red, "off");
        }
        else
        {
            $("#red_icon").html("<i class='fas fa-lightbulb'></i>");
            setState(red, "on");
        }
    });

    $("#yellow_box").click(() => {
        if (current_state[yellow] == "ON")
        {
            $("#yellow_icon").html("<i class='far fa-lightbulb'></i>");
            setState(yellow, "off");
        }
        else
        {
            $("#yellow_icon").html("<i class='fas fa-lightbulb'></i>");
            setState(yellow, "on");
        }
    });

    $("#green_box").click(() => {
        if (current_state[green] == "ON")
        {
            $("#green_icon").html("<i class='far fa-lightbulb'></i>");
            setState(green, "off");
        }
        else
        {
            $("#green_icon").html("<i class='fas fa-lightbulb'></i>");
            setState(green, "on");
        }
    });


});

function setState(id, state)
{
    $.post("/led/state", {
        id: id,
        state: state
    }, (data) => {
        console.log(data);
    });
}

function getUpdate()
{
    setInterval(getTime, 2000);
    setInterval(getStates, 500);
    setInterval(getDate, 3000);

    setInterval(applyFrequency, 500);
}

function updateDOM(max)
{
    if (current_stat == daily)
    {
        $("#blue_time").html(led_time.day[blue]);
        $("#blue_progress").attr("style", "width: " + (led_time.day[blue] / max) * 100 + "%");
        $("#red_time").html(led_time.day[red]);
        $("#red_progress").attr("style", "width: " + (led_time.day[red] / max) * 100 + "%");
        $("#green_time").html(led_time.day[green]);
        $("#green_progress").attr("style", "width: " + (led_time.day[green] / max) * 100 + "%");
        $("#yellow_time").html(led_time.day[yellow]);
        $("#yellow_progress").attr("style", "width: " + (led_time.day[yellow] / max) * 100 + "%");
    }

    if (current_stat == weekly)
    {
        $("#blue_time").html(led_time.week[blue]);
        $("#blue_progress").attr("style", "width: " + (led_time.week[blue] / max) * 100 + "%");
        $("#red_time").html(led_time.week[red]);
        $("#red_progress").attr("style", "width: " + (led_time.week[red] / max) * 100 + "%");
        $("#green_time").html(led_time.week[green]);
        $("#green_progress").attr("style", "width: " + (led_time.week[green] / max) * 100 + "%");
        $("#yellow_time").html(led_time.week[yellow]);
        $("#yellow_progress").attr("style", "width: " + (led_time.week[yellow] / max) * 100 + "%");
    }

    if (current_stat == monthly)
    {
        $("#blue_time").html(led_time.month[blue]);
        $("#blue_progress").attr("style", "width: " + (led_time.month[blue] / max) * 100 + "%");
        $("#red_time").html(led_time.month[red]);
        $("#red_progress").attr("style", "width: " + (led_time.month[red] / max) * 100 + "%");
        $("#green_time").html(led_time.month[green]);
        $("#green_progress").attr("style", "width: " + (led_time.month[green] / max) * 100 + "%");
        $("#yellow_time").html(led_time.month[yellow]);
        $("#yellow_progress").attr("style", "width: " + (led_time.month[yellow] / max) * 100 + "%");
    }

    if (current_stat == annualy)
    {
        $("#blue_time").html(led_time.year[blue]);
        $("#blue_progress").attr("style", "width: " + (led_time.year[blue] / max) * 100 + "%");
        $("#red_time").html(led_time.year[red]);
        $("#red_progress").attr("style", "width: " + (led_time.year[red] / max) * 100 + "%");
        $("#green_time").html(led_time.year[green]);
        $("#green_progress").attr("style", "width: " + (led_time.year[green] / max) * 100 + "%");
        $("#yellow_time").html(led_time.year[yellow]);
        $("#yellow_progress").attr("style", "width: " + (led_time.year[yellow] / max) * 100 + "%");
    }

    $(".time_total").html(max);

    $("#blue_state").html(current_state[blue]);
    $("#red_state").html(current_state[red]);
    $("#green_state").html(current_state[green]);
    $("#yellow_state").html(current_state[yellow]);

    updateChart();
}

function updateChart()
{
    chart.data.datasets[0].data = current_data[red];
    chart.data.datasets[1].data = current_data[blue];
    chart.data.datasets[2].data = current_data[green];
    chart.data.datasets[3].data = current_data[yellow];
    chart.update();
}

function applyFrequency() {

    var max = 365;

    switch (current_stat) {
        case daily:
            max = 365;
            current_label = day_label;
            current_data = graph_data.day;

            updateDOM(max);
            break;

        case weekly:
            max = 52;
            current_label = week_label;
            current_data = graph_data.week;

            updateDOM(max);
            break;

        case monthly:
            max = 12;
            current_label = month_label;
            current_data = graph_data.month;

            updateDOM(max);
            break;

        case annualy:
            max = 1;
            current_label = year_label;
            current_data = graph_data.annualy;

            updateDOM(max);
            break;
    
        default:
            break;
    }
}

function getDate()
{
    for (let index = 0; index < 4; index++) {

        for (let j= 0; j < graph_data.day[index].length - 1; j++) {
            $.get("/led/time/hour?id=" + (index + 1) + "&start=" + j, (data, status) => {

                if (data.success)
                {
                    graph_data.day[index][j] = data.data.time;
                }
                
            });
        }

        for (let j= 0; j < graph_data.week[index].length - 1; j++) {
            $.get("/led/time/day?id=" + (index + 1) + "&start=" + ((j * 7) + 1), (data, status) => {

                if (data.success)
                {
                    graph_data.week[index][j] = data.data.time;
                }
                
            });
        }

        for (let j= 0; j < graph_data.month[index].length - 1; j++) {
            $.get("/led/time/week?id=" + (index + 1) + "&start=" + j, (data, status) => {

                if (data.success)
                {
                    graph_data.month[index][j] = data.data.time;
                }
                
            });
        }

        for (let j= 0; j < graph_data.year[index].length - 1; j++) {
            $.get("/led/time/month?id=" + (index + 1) + "&start=" + j, (data, status) => {

                if (data.success)
                {
                    graph_data.year[index][j] = data.data.time;
                }
                
            });
        }
        
    }

    //console.log(graph_data);
}

function getTime()
{

    for (let index = 0; index < 4; index++) {
        $.get("/led/time?id=" + (index), (data, status) => {

            if (data.success)
            {
                led_time.day[index] = data.data.time / (60 * 60 * 24 * 1000);
                led_time.week[index] = led_time.day[index] / 7;
                led_time.month[index] = led_time.day[index] / 30;
                led_time.year[index] = led_time.day[index] / 365;
            }
            
        });
        
    }

}

function getStates()
{
    for (let index = 0; index < 4; index++) {
        $.get("/led/state?id=" + (index + 1), (data, status) => {

            if (data.success)
            {
                if (data.data[index] === 'true' || data.data[index] === 'on')
                {
                    current_state[index] = "ON"
                }
                else
                {
                    current_state[index] = "OFF"
                }
            
            }
            
        });
        
    }
}

function setupGraph()
{
    var ctx = document.getElementById('timeGraph').getContext('2d');

    var data = 
    {
        labels : current_label,
        datasets: [{
                fill: false,
                borderColor: 'red',
                borderWidth: 0.5,
                label: 'Led rouge',
                data: current_data[red]
            },
            {
                fill: false,
                borderColor: 'blue',
                borderWidth: 0.5,
                label: 'Led bleu',
                data: current_data[blue]
            },
            {
                fill: false,
                borderColor: 'green',
                borderWidth: 0.5,
                label: 'Led verte',
                data: current_data[green]
            },
            {
                fill: false,
                borderColor: 'yellow',
                borderWidth: 0.5,
                label: 'Led jaune',
                data: current_data[yellow]
            }
        ]
    }

    var options

    var config = {
        type : 'line',
        data : data,
        options : options
    }

    chart = new Chart (ctx,config)
}