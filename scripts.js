var osCourse = NaN;
var deliveryCourse = NaN;
var placentaCourse = NaN;

const CANVAS_DEFAULT_WIDTH = 900;
const CANVAS_DEFAULT_HEIGHT = 480;

$(document).ready(function () {
  $("#onsetTime").datetimepicker({
    format: "YYYY/MM/DD HH:mm",
  });
  $("#delivery").datetimepicker({
    format: "YYYY/MM/DD HH:mm",
  });
  $("#placenta").datetimepicker({
    format: "YYYY/MM/DD HH:mm",
  });
});

//Fold the panel with arrow sign
$(document).on("click", ".panel-heading span.clickable", function (e) {
  var $this = $(this);
  if (!$this.hasClass("panel-collapsed")) {
    $this.parents(".panel").find(".panel-body").slideUp();
    $this.addClass("panel-collapsed");
    $this
      .find("i")
      .removeClass("glyphicon-chevron-up")
      .addClass("glyphicon-chevron-down");
  } else {
    $this.parents(".panel").find(".panel-body").slideDown();
    $this.removeClass("panel-collapsed");
    $this
      .find("i")
      .removeClass("glyphicon-chevron-down")
      .addClass("glyphicon-chevron-up");
  }
});

$(function () {
  // prevents jumping
  $("a.help").on("click", function (e) {
    e.preventDefault();
    return true;
  });
  $(".help").popover();
}); //]]>

function processData() {
  var onsetTime = document.querySelector("#onsetTime input").value;
  var delivery = document.querySelector("#delivery input").value;
  var placenta = document.querySelector("#placenta input").value;
  var record = document.getElementById("record").value;

  if (onsetTime == "" || delivery == "" || placenta == "" || record == "") {
    alert("Please fill in all the required fields.");
    return;
  }

  var records = record.split(/(?=\n\d\d\/\d\d\s\d\d:\d\d)/);

  //Processed array: cArray[time,course,os,station,processed]
  var cArray = conversionArray(records);
  writeTable(cArray, "conversionTable");

  var rArray = resultArray(cArray);
  writeTable(rArray, "resultTable");

  var pArray = partogramArray(rArray);
  drawPartogram(pArray);

  document.getElementById("osCourse").innerHTML = timeFormat(osCourse);
  document.getElementById("deliveryCourse").innerHTML = timeFormat(
    deliveryCourse - osCourse
  );
  document.getElementById("placentaCourse").innerHTML = timeFormat(
    placentaCourse - deliveryCourse
  );
  document.getElementById("totalCourse").innerHTML = timeFormat(placentaCourse);
  $("#result").collapse("show");
}

//Get array from text records: [time,course,os,station,processed]
function conversionArray(items) {
  var cArray = [];
  for (var i = 0; i < items.length; i++) {
    var temp = extractData(items[i]);
    cArray.push(temp);
  }
  var deliveryArray = getDelivery();
  cArray.push(deliveryArray);

  cArray.sort(function (a, b) {
    var valueA, valueB;

    valueA = a[1]; // sorting according to 2nd item
    valueB = b[1];
    if (valueA < valueB) {
      return -1;
    } else if (valueA > valueB) {
      return 1;
    }
    return 0;
  });

  return cArray;
}

function resultArray(items) {
  var resultArray = [];
  var osFull = 0;

  for (var i = 0; i < items.length; i++) {
    if (items[i][2] == null && items[i][3] == null) {
      continue;
    }
    var time = items[i][0];
    var os = items[i][2];
    var station = items[i][3];

    var cmTime = timeFormat(items[i][1]);
    var cmStation = transStation(station);
    if (osFull == 1) {
      var cmOS = 10;
    } else {
      var cmOS = transOS(os);
      if (cmOS == 10) {
        osCourse = items[i][1]; //global variable
        osFull = 1;
      }
    }

    resultArray.push([time, os, station, cmTime, cmOS, cmStation]);
  }

  return resultArray;
}

function partogramArray(items) {
  var pArray = [];

  for (var i = 0; i < items.length; i++) {
    pArray.push(items[i].slice(-3));
  }
  if (items[0][0] !== "00:00") {
    pArray.unshift(["00:00", 0, -3]);
  }

  return pArray;
}

function extractData(item) {
  var time = null,
    course = null,
    os = null,
    station = null;
  var processed = item.toLowerCase().replace(/\~/g, "-");

  //Match time data and calculate clinical course
  var timeMatched = item.match(/\d\d\/\d\d\s\d\d:\d\d/);
  if (timeMatched !== null) {
    time = timeMatched[0];
    course = timeCourse(time);
  }

  //Match station and os in a string
  var stringRegs = [
    "([0-5][+-]?[^0-9]{0,2})(fb?[s,.，、。]+)([+-]?[0-3][-/／]?[+-]?[0-3]?)([s,.，、。]+)",
    "os[^0-9]{0,2}([0-5][+-]?)([s,.，、。]+)([+-]?[0-3][-/／]?[+-]?[0-3]?)(.+)",
    "os[^0-9]{0,2}([0-5][+-]?)([s/]+)([+-]?[0-3]-?[+-]?[0-3]?)",
    "([0-5一二三四五][+-]?[^0-9]{0,2})(指半?[s,.，、。]+)([+-]?[0-3][-/／]?[+-]?[0-3]?)([s,.，、。]+)",
    "(full)([s,.，、。]+)([+-]?[0-3][-/／]?[+-]?[0-3]?)([s,.，、。]+)",
    "(brim)([s,.，、。]+)([+-]?[0-3][-/／]?[+-]?[0-3]?)([s,.，、。]+)",
    "(ft)([s,.，、。]+)([+-]?[0-3][-/／]?[+-/]?[0-3]?)([s,.，、。]+)",
    "([0-5][+-]?[^0-9]{0,2})(fb?[s/]+)([+-]?[0-3]-?[+-]?[0-3]?)([s/]+)",

    "(close)([s,.，、。]+)(high)([s,.，、。]+)",
    "([0-5][+-]?[^0-9]{0,2})(fb?[s,.，、。]+)(high)([s,.，、。]+)",
    "os[^0-9]{0,2}([0-5][+-]?)([s,.，、。]+)(high)(.+)",
    "os[^0-9]{0,2}([0-5][+-]?)([s/]+)(high)",
    "([0-5][+-]?[^0-9]{0,2})(fb?[s/]+)(high)([s/]+)",

    "([0-5一二三四五][+-]?[^0-9]{0,2})(指半?[s/]+)([+-]?[0-3]-?[+-]?[0-3]?)([s/]+)",
    "(full)([s/]+)([+-]?[0-3]-?[+-]?[0-3]?)(.+)",
    "(brim)([s/]+)([+-]?[0-3]-?[+-]?[0-3]?)(.+)",
    "(ft)([s/]+)([+-]?[0-3]-?[+-]?[0-3]?)(.+)",
  ];

  for (var i = 0; i < stringRegs.length; i++) {
    var Reg = new RegExp(stringRegs[i]);
    var matched = null;

    matched = processed.match(Reg);
    if (matched !== null) {
      os = matched[1];
      station = matched[3];
      processed = processed.replace(
        matched[1] + matched[2] + matched[3] + matched[4],
        '<span style="color:red;">' +
          matched[1] +
          "</span>" +
          matched[2] +
          '<span style="color:blue;">' +
          matched[3] +
          "</span>" +
          matched[4]
      );
    }
  }

  //Match station
  if (station == null) {
    var stationRegs = [
      "station[^0-9+-]{0,5}(high)",
      "胎位.{0,3}(高)",
      "station[^0-9+-]{0,2}s?([+-]?[0-3][-/／]?[+-]?[0-3]?)",
      "胎位[^0-9+-]{0,5}([+-]?[0-3][-/／]?[+-]?[0-3]?)",
      "[^a-z]s:[^0-9+-]{0,2}s?([+-]?[0-3][-/／]?[+-]?[0-3]?)",
    ];
    for (var i = 0; i < stationRegs.length; i++) {
      var Reg = new RegExp(stationRegs[i]);
      var matched = null;
      matched = processed.match(Reg);
      if (matched !== null) {
        station = matched[1];
        processed = processed.replace(
          matched[0],
          '<span style="color:blue;">' + matched[0] + "</span>"
        );
        break;
      }
    }
  }

  //Match cervical os
  if (os == null) {
    var osRegs = [
      "os[^0-9]{0,3}([0-5][+-]?).{0,2}fb?",
      "os[^0-9]{0,2}([0-5][+-]?)",
      "子?宮頸?口?[^0-9底]{0,3}([0-5一二三四五][+-]?).{0,2}指半?",
      "子?宮頸?口?[^0-9底]{0,3}([0-5][+-]?).{0,2}fb?",
      "頸口.{0,3}([0-5一二三四五][+-]?.{0,2})指半?",
      "os.{0,3}([0-5一二三四五][+-]?.{0,2})指半?",
      "os.{0,3}(full)",
      "內診.{0,5}(full)",
      "內診[^0-9]{0,3}([0-5一二三四五][+-]?).{0,2}指半?",
      "內診[^0-9]{0,3}([0-5][+-]?).{0,2}fb?",
      "子?宮頸?口?.{0,3}(full)",
      "子?宮頸?口?.{0,3}(ft)",
      "子?宮頸?口?(全開)",
      "子?宮頸?口?.{0,3}(緊)",
      "os.{0,3}(緊)",
      "os.{0,3}(close)",
      "os.{0,3}(ft)",
      "(brim)",
    ];
    for (var i = 0; i < osRegs.length; i++) {
      var Reg = new RegExp(osRegs[i]);
      var matched = null;

      matched = processed.match(Reg);
      if (matched !== null) {
        os = matched[1];
        processed = processed.replace(
          matched[0],
          '<span style="color:red;">' + matched[0] + "</span>"
        );
        break;
      }
    }
  }

  return [time, course, os, station, processed];
}

function getDelivery() {
  var startTime = new Date($("#onsetTime").find("input").val());
  var deliveryString = $("#delivery").find("input").val();
  var deliveryTime = new Date(deliveryString);
  deliveryString = deliveryString.substr(5);

  var placentaString = $("#placenta").find("input").val();
  var placentaTime = new Date(placentaString);
  placentaCourse = (placentaTime.getTime() - startTime.getTime()) / 1000 / 60; //global variable

  var diff = deliveryTime.getTime() - startTime.getTime();
  deliveryCourse = diff / 1000 / 60; //global variable
  return [deliveryString, deliveryCourse, "full", "+3", "出生"];
}

function timeCourse(itemTime) {
  var startTime = new Date($("#onsetTime").find("input").val());
  var year = startTime.getFullYear();
  var endTime = new Date(year + "/" + itemTime);
  if (startTime.getMonth() == 11 && endTime.getMonth() == 0) {
    endTime.setYear(year + 1);
  }

  var diff = endTime.getTime() - startTime.getTime();
  var resultTime = diff / 1000 / 60;
  return resultTime;
}

function timeFormat(minutes) {
  var negative = false;
  if (minutes < 0) {
    minutes = -minutes;
    negative = true;
  }

  var days = Math.floor(minutes / 60 / 24);
  minutes -= days * 1440;
  var hours = Math.floor(minutes / 60);
  var minutes = minutes % 60;
  if (hours < 10 && hours >= 0) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  var formatted = hours + ":" + minutes;
  if (days > 0) {
    formatted = days + "D " + formatted;
  }

  if (negative == true) {
    formatted = "- " + formatted;
  }
  return formatted;
}

function timeFormat(minutes) {
  var negative = false;
  if (minutes < 0) {
    minutes = -minutes;
    negative = true;
  }

  var hours = Math.floor(minutes / 60);
  var minutes = minutes % 60;
  if (hours < 10 && hours >= 0) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  var formatted = hours + ":" + minutes;

  if (negative == true) {
    formatted = "- " + formatted;
  }
  return formatted;
}

function transOS(strOS) {
  switch (strOS) {
    case "1":
      strOS = 2;
      break;
    case "2":
      strOS = 4;
      break;
    case "3":
      strOS = 6;
      break;
    case "4":
      strOS = 8;
      break;
    case "5":
      strOS = 10;
      break;
    case "1+":
      strOS = 3;
      break;
    case "2+":
      strOS = 5;
      break;
    case "3+":
      strOS = 7;
      break;
    case "4+":
      strOS = 9;
      break;
    case "1-":
      strOS = 1;
      break;
    case "2-":
      strOS = 3;
      break;
    case "3-":
      strOS = 5;
      break;
    case "4-":
      strOS = 7;
      break;
    case "ft":
      strOS = 1;
      break;
    case "close":
      strOS = 0;
      break;
    case "緊":
      strOS = 0;
      break;
    case "full":
      strOS = 10;
      break;
    case "brim":
      strOS = 9.5;
      break;
    case "全開":
      strOS = 10;
      break;
    case "一指":
      strOS = 2;
      break;
    case "一指半":
      strOS = 3;
      break;
    case "二指":
      strOS = 4;
      break;
    case "二指半":
      strOS = 5;
      break;
    case "三指":
      strOS = 6;
      break;
    case "三指半":
      strOS = 7;
      break;
    case "四指":
      strOS = 8;
      break;
    case "四指半":
      strOS = 9;
      break;
    case "五指":
      strOS = 10;
      break;
  }
  return strOS;
}

function transStation(strStation) {
  if (strStation == null) {
    return strStation;
  }
  strStation = strStation.replace(/／/g, "/");
  strStation = strStation.replace(/\+/g, "");
  switch (strStation) {
    case "-3":
      strStation = -3;
      break;
    case "-2":
      strStation = -2;
      break;
    case "-1":
      strStation = -1;
      break;
    case "0":
      strStation = 0;
      break;
    case "1":
      strStation = 1;
      break;
    case "2":
      strStation = 2;
      break;
    case "3":
      strStation = 3;
      break;
    case "high":
      strStation = -3;
      break;
    case "高":
      strStation = -3;
      break;
    case "-3--2":
      strStation = -2.5;
      break;
    case "-2--1":
      strStation = -1.5;
      break;
    case "-1-0":
      strStation = -0.5;
      break;
    case "0-1":
      strStation = 0.5;
      break;
    case "1-2":
      strStation = 1.5;
      break;
    case "2-3":
      strStation = 2.5;
      break;
    case "-3/-2":
      strStation = -2.5;
      break;
    case "-2/-1":
      strStation = -1.5;
      break;
    case "-1/0":
      strStation = -0.5;
      break;
    case "0/1":
      strStation = 0.5;
      break;
    case "1/2":
      strStation = 1.5;
      break;
    case "2/3":
      strStation = 2.5;
      break;
  }
  return strStation;
}

function writeTable(myArray, myTable) {
  $("#" + myTable).empty();
  var t = document.getElementById(myTable);
  for (var i = 0; i < myArray.length; i++) {
    t.insertRow();
    for (var j = 0; j < myArray[i].length; j++) {
      t.rows[i].insertCell(j);
      t.rows[i].cells[j].innerHTML = myArray[i][j];
    }
  }
}

function drawPartogram(pArray) {
  var container = document.getElementById("partogramCanvasContainer");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  var existingTooltip = document.getElementById("partogramTooltip");
  if (existingTooltip) {
    existingTooltip.style.display = "none";
  }
  var processed = [];

  for (var i = 0; i < pArray.length; i++) {
    var entry = pArray[i];
    if (!entry || entry.length < 3) {
      continue;
    }

    var hours = parseTime(entry[0]);
    if (hours === null || isNaN(hours)) {
      continue;
    }

    processed.push({
      hours: hours,
      dilation: parseNumber(entry[1]),
      station: parseNumber(entry[2]),
    });
  }

  processed.sort(function (a, b) {
    return a.hours - b.hours;
  });

  var maxHours = processed.length ? processed[processed.length - 1].hours : 0;
  var dayCount = Math.max(1, Math.ceil(maxHours / 24));

  var boundaries = [];
  for (var day = 1; day < dayCount; day++) {
    boundaries.push(day * 24);
  }
  addInterpolatedBoundaries(boundaries);
  processed.sort(function (a, b) {
    return a.hours - b.hours;
  });

  if (processed.length === 0) {
    createDayCanvas(0, []);
    return;
  }

  for (var dayIndex = 0; dayIndex < dayCount; dayIndex++) {
    var dayStart = dayIndex * 24;
    var dayEnd = dayStart + 24 + 1e-6;
    var pointsForDay = [];

    for (var j = 0; j < processed.length; j++) {
      var point = processed[j];
      if (point.hours < dayStart - 1e-6 || point.hours > dayEnd) {
        continue;
      }
      pointsForDay.push({
        hours: point.hours - dayStart,
        dilation: point.dilation,
        station: point.station,
        absoluteHours: point.hours,
      });
    }

    createDayCanvas(dayIndex, pointsForDay);
  }

  function addInterpolatedBoundaries(boundaryHours) {
    for (var b = 0; b < boundaryHours.length; b++) {
      var boundary = boundaryHours[b];
      var exists = processed.some(function (point) {
        return Math.abs(point.hours - boundary) < 1e-6;
      });
      if (exists) {
        continue;
      }

      var before = null;
      var after = null;
      for (var idx = 0; idx < processed.length; idx++) {
        if (processed[idx].hours < boundary) {
          before = processed[idx];
        } else if (processed[idx].hours > boundary) {
          after = processed[idx];
          break;
        }
      }

      if (!before || !after) {
        continue;
      }

      var ratio = (boundary - before.hours) / (after.hours - before.hours);
      processed.push({
        hours: boundary,
        dilation: interpolateValue(before.dilation, after.dilation, ratio),
        station: interpolateValue(before.station, after.station, ratio),
      });
    }

    function interpolateValue(a, b, ratio) {
      if (isNaN(a) && isNaN(b)) {
        return NaN;
      }
      if (isNaN(a)) {
        return b;
      }
      if (isNaN(b)) {
        return a;
      }
      return a + (b - a) * ratio;
    }
  }

  function createDayCanvas(dayIndex, points) {
    var canvas = document.createElement("canvas");
    canvas.width = CANVAS_DEFAULT_WIDTH;
    canvas.height = CANVAS_DEFAULT_HEIGHT;
    canvas.className = "partogram-canvas";
    container.appendChild(canvas);

    var rendered = drawSingleDay(canvas, points, dayIndex + 1);
    if (
      rendered &&
      (rendered.dilationPoints.length || rendered.stationPoints.length)
    ) {
      enableHover(canvas, rendered);
    }
  }

  function drawSingleDay(canvas, points, dayLabel) {
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    var margin = { top: 40, right: 70, bottom: 60, left: 80 };
    var plotWidth = width - margin.left - margin.right;
    var plotHeight = height - margin.top - margin.bottom;
    var maxHours = 24;
    var maxDilation = 10;

    // Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // ctx.fillStyle = "#000";
    // ctx.font = "12px Arial";
    // ctx.textBaseline = "middle";
    // ctx.save();
    // ctx.textAlign = "left";
    // ctx.fillText("↖", 0, 0);
    // ctx.fillText("↙", 0, height);
    // ctx.textAlign = "right";
    // ctx.fillText("↗", width, 0);
    // ctx.fillText("↘", width, height);
    // ctx.restore();

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, plotWidth, plotHeight);

    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 1;
    for (var i = 0; i <= 12; i++) {
      var y = margin.top + (plotHeight / 12) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
    for (var hour = 0; hour <= maxHours; hour++) {
      var x = margin.left + (plotWidth / maxHours) * hour;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
    }

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (var hourLabel = 0; hourLabel <= maxHours; hourLabel++) {
      var xLabel = margin.left + (plotWidth / maxHours) * hourLabel;
      ctx.fillText(hourLabel.toString(), xLabel, height - margin.bottom + 8);
    }
    ctx.fillText(
      "Hour",
      margin.left + plotWidth / 2,
      height - margin.bottom + 28
    );

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (var j = 0; j <= 10; j++) {
      var dilationValue = 10 - j;
      var yLabel = margin.top + (plotHeight / 12) * (j + 2);
      ctx.fillText(dilationValue.toString(), margin.left - 12, yLabel);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (var stationValue = -3; stationValue <= 3; stationValue++) {
      var yStationLabel = margin.top + ((stationValue + 3) / 6) * plotHeight;
      var text =
        stationValue > 0 ? "+" + stationValue : stationValue.toString();
      ctx.fillText(text, width - margin.right + 10, yStationLabel);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("day" + dayLabel, margin.left - 40, margin.top + 20);

    ctx.save();
    ctx.translate(margin.left - 60, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Cervical dilatation (cm)", 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(width - margin.right + 40, margin.top + plotHeight / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Station", 0, 0);
    ctx.restore();

    // Data points
    var dilationPoints = [];
    var stationPoints = [];

    for (var p = 0; p < points.length; p++) {
      var entry = points[p];
      var localHours = Math.max(0, Math.min(maxHours, entry.hours));
      var xPos = margin.left + (localHours / maxHours) * plotWidth;

      if (!isNaN(entry.dilation)) {
        var clampedDilation = Math.max(
          0,
          Math.min(maxDilation, entry.dilation)
        );
        var yDilation =
          height - margin.bottom - (clampedDilation / 12) * plotHeight;

        dilationPoints.push({
          x: xPos,
          y: yDilation,
          value: clampedDilation,
          absoluteHours: entry.absoluteHours,
          localHours: localHours,
          type: "dilation",
          dayLabel: dayLabel,
        });
      }

      if (!isNaN(entry.station)) {
        var clampedStation = Math.max(-3, Math.min(3, entry.station));
        var yStation = margin.top + ((clampedStation + 3) / 6) * plotHeight;

        stationPoints.push({
          x: xPos,
          y: yStation,
          value: clampedStation,
          absoluteHours: entry.absoluteHours,
          localHours: localHours,
          type: "station",
          dayLabel: dayLabel,
        });
      }
    }

    drawSeries(ctx, dilationPoints, "#cc0000");
    drawSeries(ctx, stationPoints, "#0055ff");

    return {
      dayLabel: dayLabel,
      dilationPoints: dilationPoints,
      stationPoints: stationPoints,
    };
  }

  function drawSeries(ctx, points, color) {
    if (!points || points.length === 0) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    // Points
    ctx.fillStyle = color;
    for (var j = 0; j < points.length; j++) {
      ctx.beginPath();
      ctx.arc(points[j].x, points[j].y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function enableHover(canvas, data) {
    var datasets = [];
    if (data.dilationPoints.length) {
      datasets.push({
        type: "dilation",
        label: "Cervical dilatation",
        points: data.dilationPoints,
      });
    }
    if (data.stationPoints.length) {
      datasets.push({
        type: "station",
        label: "Station",
        points: data.stationPoints,
      });
    }
    if (!datasets.length) {
      return;
    }

    var tooltip = ensureTooltip();
    var hitRadius = 6;

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", hideTooltip);

    function handleMove(event) {
      var rect = canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) * (CANVAS_DEFAULT_WIDTH / rect.width);
      var y =
        (event.clientY - rect.top) * (CANVAS_DEFAULT_HEIGHT / rect.height);
      var closest = null;

      for (var i = 0; i < datasets.length; i++) {
        var dataset = datasets[i];
        for (var j = 0; j < dataset.points.length; j++) {
          var point = dataset.points[j];
          var dx = x - point.x;
          var dy = y - point.y;
          var distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= hitRadius) {
            if (!closest || distance < closest.distance) {
              closest = {
                distance: distance,
                dataset: dataset,
                point: point,
              };
            }
          }
        }
      }

      if (closest) {
        var timeText = formatTooltipTime(closest.point.absoluteHours);
        var valueText = formatValue(closest.point.value, closest.dataset.type);

        tooltip.innerHTML =
          timeText + "<br />" + closest.dataset.label + ": " + valueText;
        tooltip.style.display = "block";
        tooltip.style.left = event.pageX + 12 + "px";
        tooltip.style.top = event.pageY + 12 + "px";
        canvas.style.cursor = "pointer";
      } else {
        hideTooltip();
      }
    }

    function ensureTooltip() {
      var tooltip = document.getElementById("partogramTooltip");
      if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "partogramTooltip";
        tooltip.className = "partogram-tooltip";
        document.body.appendChild(tooltip);
      }
      return tooltip;
    }

    function hideTooltip() {
      tooltip.style.display = "none";
      canvas.style.cursor = "default";
    }
  }

  function formatTooltipTime(totalHours) {
    var hours = Math.floor(totalHours);
    var minutes = Math.round((totalHours - hours) * 60);
    var result;

    if (Math.ceil((totalHours + 1e-6) / 24) > 1) {
      result = `${pad(hours)}:${pad(minutes)} (${pad(hours % 24)}:${pad(
        minutes
      )})`;
    } else {
      result = `${pad(hours)}:${pad(minutes)}`;
    }

    return result;

    function pad(value) {
      return value < 10 ? "0" + value : String(value);
    }
  }

  function formatValue(value, type) {
    if (isNaN(value)) {
      return "N/A";
    }
    var display = formatNumber(value);
    if (type === "dilation") {
      return display + " cm";
    }
    if (type === "station") {
      if (value > 0 && display.charAt(0) !== "+") {
        display = "+" + display;
      }
      return display;
    }
    return display;
  }

  function formatNumber(value) {
    var fixed = value.toFixed(1);
    if (fixed.indexOf(".") !== -1) {
      fixed = fixed.replace(/\.0$/, "");
    }
    return fixed;
  }

  function parseTime(label) {
    if (label == null) {
      return null;
    }
    var text = String(label).trim();
    if (text.length === 0) {
      return null;
    }

    var days = 0;
    var dayMatch = text.match(/^(\d+)D\s*/i);
    if (dayMatch) {
      days = parseInt(dayMatch[1], 10);
      text = text.slice(dayMatch[0].length);
    }

    var parts = text.split(":");
    if (parts.length !== 2) {
      return null;
    }
    var hours = parseInt(parts[0], 10);
    var minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }
    return days * 24 + hours + minutes / 60;
  }

  function parseNumber(value) {
    var num = Number(value);
    return isNaN(num) ? NaN : num;
  }
}
