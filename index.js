// TODO list
// -

function loadData() {
  const files = [d3.csv(`./data/elPratViz2025Data.csv`)];

  Promise.all(files)
    .then(function (files) {
      init(files);
    })
    .catch(function (err) {
      // handle error here
      console.log("Promise all error", err);
    });
}

loadData();

// Constants ////////////////////////////////////////////////////////////////

const duration = 1500;
const halfDuration = 750;
const PI = Math.PI;
const PI2 = PI * 2;
const PI_2 = PI / 2;
const aspectRatio = 19.5 / 9;

const R1 = 30;
const R2 = 60;
const orderD = 30;
const studentR = 12;
const relativeR = 8;
const relativePlayR = 10;
const compositionPlayR = 20;
const nextPrevR = compositionPlayR * 0.7;

let audioObjects = {};

const order = {
  Yo: 1,
  Jo: 1,
  Hermano: 1,
  Hermana: 1,
  Germà: 1,
  Germana: 1,
  Primo: 1,
  Prima: 1,
  Cosí: 1,
  Cosina: 1,
  Cosines: 1,
  Amic: 1,
  Amics: 1,
  Amiga: 1,
  Amigo: 1,
  Amigos: 1,
  Amigues: 1,
  Pareja: 1,
  Parella: 1,
  Padre: 2,
  Madre: 2,
  Pare: 2,
  Mare: 2,
  Padrastro: 2,
  Madrastra: 2,
  Tío: 2,
  Tía: 2,
  Tiet: 2,
  Tieta: 2,
  Abuelo: 3,
  Abuela: 3,
  Yaya: 3,
  Yayo: 3,
  Avi: 3,
  Àvia: 3,
  "Tía àvia": 3,
  "Tío abuelo": 3,
  Familiar: 3,
  Familiares: 3,
  Bisabuelo: 4,
  Bisabuela: 4,
  Profesor: 4,
  Profesora: 4,
};

const txtRelativeColor = "#d4d4d4";
const txtOriginColor = "#8f8f8f";
const linkColor = "#D4D4D4FF";
const highlightColor = "#ffffff";

const colors = [
  "#d1f586",
  "#aafd21",
  "#71a92f",
  "#b5fb82",
  "#80ff54",
  "#b9f9a3",
  "#74a66c",
  "#02d53f",
  "#00b65c",
  "#01ec84",
  "#24ae7d",
  "#1cffbe",
  "#7bbaa0",
  "#b3f6dc",
  "#7cffd8",
  "#01b09c",
  "#01e9d7",
  "#02aad3",
  "#8bd1ff",
  "#799adb",
  "#c37ee5",
  "#e7b0ff",
  "#ff9ade",
  "#ff6dab",
  "#fc6d50",
  "#ffc39c",
  "#cb8c5f",
  "#ff8e0b",
  "#ffaf4c",
  "#ffac33",
  "#c19149",
  "#ffd87c",
  "#b59829",
  "#fce6ad",
  "#ffe754",
  "#acba00",
  "#e5f15d",
];

let currentId = 1;

function init(files) {
  const dataRaw = files[0];
  const allCompositions = formatData(dataRaw);
  console.log("allCompositions", allCompositions);
  const numberOfCompositions = Object.keys(allCompositions).length;

  drawGraph(allCompositions);

  function drawGraph(data) {
    ///////////////////////////////////////////////////////////////////////////
    // Set up data ////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    const starData = data[currentId];

    ///////////////////////////////////////////////////////////////////////////
    // Set up svg /////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    const container = document.getElementById("graph");
    const svgWidth = container.clientWidth;
    const svgHeight = container.clientHeight;
    const center = { x: svgWidth / 2, y: svgHeight / 2 };
    const orientation = svgWidth > svgHeight ? "horizontal" : "vertical";

    // Clear ///////////////////////////////////////////////////////////////////
    d3.select("#graph").selectAll("*").remove();

    // Containers //////////////////////////////////////////////////////////////
    const svg = d3
      .select("#graph")
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("class", "mh-auto")
      .style("user-select", "none");

    const chartContainer = svg
      .append("g")
      .attr("transform", d => `translate(${center.x}, ${center.y * 0.8})`);

    // Glow ////////////////////////////////////////////////////////////////
    const defs = svg.append("defs");

    createGlowFilter(defs, "glow", 5);
    createShadowFilter(defs, "drop-shadow", 1);

    ///////////////////////////////////////////////////////////////////////////
    // Draw ///////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    drawStar(starData, orientation);

    // Draw functions /////////////////////////////////////////////////////////
    function drawStar(data, orientation) {
      const color = colors[d3.randomInt(colors.length)()];
      getCoordinates(data, orientation);

      // Add composition audio
      audioObjects["composition"] = new Audio(`./audios/${data.pieza_path}`);

      // Containers ///////////////////////////////////////////////////////////
      const starContainer = chartContainer.append("g");

      // Students /////////////////////////////////////////////////////////////
      const studentGroup = starContainer
        .selectAll(".studentGroup")
        .data(Object.values(data.alumnos))
        .join("g")
        .attr("class", "studentGroup");

      studentGroup
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .style("fill", chroma(color).darken(2))
        .style("filter", "url(#glow)");
      // .style("stroke", highlightColor)
      // .style("stroke-width", "3px");

      studentGroup
        .append("text")
        .attr("x", d => d.x)
        .attr("y", d => (d.a > PI ? d.y + d.r + 20 : d.y - d.r - 20))
        .attr("dy", d => (d.a > PI ? "0em" : "0.7em"))
        .attr("text-anchor", "middle")
        .style("font", "14px arial")
        .style("fill", txtRelativeColor)
        .text(d => d.id);

      // Links ////////////////////////////////////////////////////////////////
      const linkLines = studentGroup
        .selectAll(".link")
        .data(d => getLinks(d))
        .join("line")
        .attr("class", "link")
        .attr("x1", d => d.sourceX)
        .attr("y1", d => d.sourceY)
        .attr("x2", d => {
          if (!d.targetX) console.log("d !d.targetX", d);
          return d.targetX;
        })
        .attr("y2", d => d.targetY)
        .style("stroke", d =>
          d.usada === 1 ? chroma(color).darken(1.8) : chroma(color).darken(2.5)
        )
        .style("stroke-width", d => (d.usada === 1 ? 3 : 1))
        .lower();

      // Parientes ////////////////////////////////////////////////////////////
      const relativeGroup = studentGroup
        .selectAll(".relativeGroup")
        .data(d => Object.values(d.parientes))
        .join("g")
        .attr("class", "relativeGroup")
        .style("cursor", d => (d.usada === 1 ? "pointer" : "default"));

      relativeGroup
        .append("title")
        .text(
          d =>
            `${d.frase}${d.frase && d.significado ? ":" : ""} ${d.significado}`
        );

      const relativeWithAudio = relativeGroup.filter(d => d.usada === 1);

      // Big translucent circles
      relativeWithAudio
        .append("circle")
        .attr("id", d => `aureola-${sanitizeId(d.id)}`)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r * 2.8)
        .style("fill", chroma(color).darken(2))
        .style("fill-opacity", 0.08)
        .style("filter", "url(#glow)")
        .style("pointer-events", "none")
        .style("display", "none");

      // Relative circles
      relativeGroup
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .style("fill", d =>
          d.usada === 1 ? chroma(color).darken(1.8) : chroma(color).darken(2.5)
        )
        .style("filter", "url(#glow)");

      // play icon in each relative with audio
      relativeWithAudio.each(function (d) {
        const sanitizedId = sanitizeId(d.id);
        const relativeElement = d3.select(this);
        const audio = new Audio(`./audios/${d.grabacion_path}`);
        audioObjects[sanitizedId] = audio;

        // Add ended event listener
        audio.addEventListener("ended", function () {
          d3.select("#playIcon" + sanitizedId).style("display", "block");
          d3.select("#pauseIcon" + sanitizedId).style("display", "none");
          d3.select(`#aureola-${sanitizedId}`).style("display", "none");
        });

        drawPlayPauseIcon(relativeElement, d.x, d.y, d.r, sanitizedId);
        handlePlayPause(relativeElement, sanitizedId);
      });

      const relativeTextsGroup = relativeGroup
        .append("g")
        .attr("transform", d => `translate(${d.textX}, ${d.textY})`);

      relativeTextsGroup
        .append("text")
        .attr("transform", function (d) {
          return `rotate(${
            d.a > PI_2 && d.a < PI_2 * 3
              ? radToDegrees(d.a + PI)
              : radToDegrees(d.a)
          })`;
        })
        .attr("y", -7)
        .attr("dy", "0.35em")
        .attr("text-anchor", d =>
          d.a > PI_2 && d.a < PI_2 * 3 ? "end" : "start"
        )
        .style("font", "12px arial")
        .style("fill", txtRelativeColor)
        .text(d => d.parentesco);

      relativeTextsGroup
        .append("text")
        .attr(
          "transform",
          d =>
            `rotate(${
              d.a > PI_2 && d.a < PI_2 * 3
                ? radToDegrees(d.a + PI)
                : radToDegrees(d.a)
            })`
        )
        .attr("y", 7)
        .attr("dy", "0.35em")
        .attr("text-anchor", d =>
          d.a > PI_2 && d.a < PI_2 * 3 ? "end" : "start"
        )
        .style("font", "10px arial")
        .style("fill", txtOriginColor)
        .text(d => d.origen);

      /////////////////////////////////////////////////////////////////////////
      // Audio composition controls ///////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////
      const yPosControls = R1 + R2 + 5 * orderD;
      const audioControls = starContainer
        .append("g")
        .attr("id", "audioControls")
        .attr("transform", `translate(${0}, ${yPosControls})`);

      // Play/Pause Button ////////////////////////////////////////////////////
      const compositionPlayPauseButtonContainer = audioControls
        .append("g")
        .attr("id", "compositionPlayPauseButtonContainer");

      compositionPlayPauseButtonContainer
        .append("circle")
        .attr("id", "playComposition")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", compositionPlayR)
        .style("fill", chroma(color));

      drawPlayPauseIcon(
        compositionPlayPauseButtonContainer,
        0,
        0,
        compositionPlayR,
        "composition"
      );

      handlePlayPause(compositionPlayPauseButtonContainer, "composition");

      // Next button //////////////////////////////////////////////////////////
      const compositionNextButtonContainer = audioControls
        .append("g")
        .attr("id", "nextButton")
        .attr("transform", `translate(${50}, 0)`);

      compositionNextButtonContainer
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", nextPrevR)
        .style("fill", chroma(color));

      drawNextPreviousIcon(compositionNextButtonContainer, nextPrevR, "next");

      // Previous button //////////////////////////////////////////////////////
      const compositionPreviousButtonContainer = audioControls
        .append("g")
        .attr("id", "previousButton")
        .attr("transform", `translate(${-50}, 0)`);

      compositionPreviousButtonContainer
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", nextPrevR)
        .style("fill", chroma(color));

      drawNextPreviousIcon(
        compositionPreviousButtonContainer,
        nextPrevR,
        "previous"
      );

      // Add info /////////////////////////////////////////////////////////////
      // Centro
      const centroText = audioControls
        .append("text")
        .attr("x", 0)
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .style("font", "14px arial")
        .style("fill", txtRelativeColor)
        .text(data.centro);

      // Docente + Curso
      const docenteText = audioControls
        .append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .style("font", "10px arial")
        .style("fill", txtRelativeColor)
        .text(data.docente + " - " + data.curso);

      // Add event listeners //////////////////////////////////////////////////
      d3.select("#nextButton").on("click", function () {
        // Pause all  audios
        Object.keys(audioObjects).forEach(key => {
          audioObjects[key].pause();
        });
        // Reset audioObjects
        audioObjects = {};

        // Update star
        currentId = currentId >= numberOfCompositions ? 1 : currentId + 1;
        drawGraph(allCompositions);
      });

      d3.select("#previousButton").on("click", function () {
        // Pause all  audios
        Object.keys(audioObjects).forEach(key => {
          audioObjects[key].pause();
        });
        // Reset audioObjects
        audioObjects = {};

        // Update star
        currentId = currentId <= 1 ? numberOfCompositions : currentId - 1;
        drawGraph(allCompositions);
      });
    }

    function drawPlayPauseIcon(container, x, y, r, id) {
      container.style("cursor", "pointer");

      const playIcon = container
        .append("g")
        .attr("transform", `translate(${x}, ${y})`)
        .attr("id", "playIcon" + id);

      playIcon
        .append("path")
        .attr("transform", "rotate(90)")
        .attr("d", triangle(r * 1.1))
        .attr("pointer-events", "none")
        .style("fill", "white")
        .style("filter", "url(#drop-shadow)");

      const pauseIcon = container
        .append("g")
        .attr("transform", `translate(${x}, ${y})`)
        .attr("id", "pauseIcon" + id)
        .style("display", "none");

      pauseIcon
        .append("rect")
        .attr("x", -r * 0.4)
        .attr("y", -r * 0.5)
        .attr("width", r * 0.3)
        .attr("height", r)
        .style("fill", "white")
        .style("filter", "url(#drop-shadow)");

      pauseIcon
        .append("rect")
        .attr("x", r * 0.1)
        .attr("y", -r * 0.5)
        .attr("width", r * 0.3)
        .attr("height", r)
        .style("fill", "white")
        .style("filter", "url(#drop-shadow)");
    }

    function drawNextPreviousIcon(container, r, direction) {
      container.style("cursor", "pointer");

      const icon = container
        .append("g")
        .attr("transform", `rotate(${direction === "next" ? 90 : 270})`);

      icon
        .append("path")
        .attr("transform", `translate(0, ${r * 0.3})`)
        .attr("d", triangle(r * 0.7))
        .attr("pointer-events", "none")
        .style("fill", "white")
        .style("filter", "url(#drop-shadow)");
      icon
        .append("path")
        .attr("transform", `translate(0, ${-r * 0.3})`)
        .attr("d", triangle(r * 0.7))
        .attr("pointer-events", "none")
        .style("fill", "white")
        .style("filter", "url(#drop-shadow)");
    }

    function handlePlayPause(container, id) {
      container.on("click", function () {
        const audio = audioObjects[id];
        if (audio.paused) {
          // Pause all other audios
          Object.keys(audioObjects).forEach(key => {
            if (key !== id) {
              audioObjects[key].pause();
              d3.select("#playIcon" + key).style("display", "block");
              d3.select("#pauseIcon" + key).style("display", "none");
              d3.select(`#aureola-${key}`).style("display", "none");
            }
          });

          audio.play();
          d3.select("#playIcon" + id).style("display", "none");
          d3.select("#pauseIcon" + id).style("display", "block");
          d3.select(`#aureola-${id}`).style("display", "block");
        } else {
          audio.pause();
          d3.select("#playIcon" + id).style("display", "block");
          d3.select("#pauseIcon" + id).style("display", "none");
          d3.select(`#aureola-${id}`).style("display", "none");
        }
      });
    }
  }

  // Resize event /////////////////////////////////////////////////////////////
  window.addEventListener("resize", function () {
    drawGraph(allCompositions);
  });
}

///////////////////////////////////////////////////////////////////////////////
// FUNTIONS ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
function formatData(dataRaw) {
  const data = {};
  dataRaw.forEach(d => {
    const {
      id,
      docente,
      centro,
      curso,
      pieza_path,
      alumno,
      grabacion_path,
      grabacion_id,
      pariente,
      parentesco,
      origen,
      usada,
      frase,
      significado,
    } = d;

    if (!data[id]) {
      data[id] = {
        id,
        centro,
        docente,
        curso,
        pieza_path,
        alumnos: {},
      };
    }

    if (!data[id].alumnos[alumno]) {
      data[id].alumnos[alumno] = {
        id: alumno,
        parientes: {},
      };
    }

    if (+usada === 1) {
      data[id].alumnos[alumno].parientes[grabacion_id] = {
        id: grabacion_id,
        parentesco,
        origen,
        orden: order[parentesco],
        grabacion_path,
        frase,
        significado,
        usada: +usada,
      };
    } else {
      // comprobar que dentro de data[id].alumnos[alumno].parientes, que es un mapa,
      // no haya un objeto con el mismo parentesco+pariente
      // si no lo hay meterlo
      const parientes = Object.values(data[id].alumnos[alumno].parientes);
      const registrado = parientes.filter(
        d => `${d.parentesco}${pariente}` === `${parentesco}${pariente}`
      ).length;

      if (registrado === 0) {
        data[id].alumnos[alumno].parientes[grabacion_id] = {
          id: grabacion_id,
          parentesco,
          origen,
          orden: order[parentesco],
          grabacion_path,
          frase,
          significado,
          usada: +usada,
        };
      }
    }
  });
  return data;
}

function getCoordinates(data, orientation) {
  const initA = orientation === "horizontal" ? 0 : PI_2;

  Object.values(data.alumnos).forEach((student, i, studentArray) => {
    const numberOfStudents = studentArray.length;
    const maxfanA = numberOfStudents === 2 ? PI2 * 0.45 : PI2 * 0.33;
    const initRelativeA = PI2 * 0.06;
    let fanA;

    const studenA = initA + (PI2 / studentArray.length) * i;
    student.x = R1 * Math.cos(studenA);
    student.y = R1 * Math.sin(studenA);
    student.r = studentR;
    student.a = studenA;

    Object.values(student.parientes).forEach((relative, i, relativeArray) => {
      fanA =
        (relativeArray.length - 1) * initRelativeA > maxfanA
          ? maxfanA
          : initRelativeA * (relativeArray.length - 1);

      const textD = 20;
      const initA = studenA - fanA / 2;
      const relativeA =
        relativeArray.length === 1
          ? initA + fanA / 2
          : initA + (fanA / (relativeArray.length - 1)) * i;

      const orden = relative.orden ? relative.orden : 2;
      if (!relative.orden)
        console.log(
          "Alerta! No se ha encontrado orden para el pariente: ",
          relative
        );

      relative.x = student.x + (R2 + orderD * orden) * Math.cos(relativeA);
      relative.y = student.y + (R2 + orderD * orden) * Math.sin(relativeA);
      relative.r = relative.usada === 1 ? relativePlayR : relativeR;
      relative.a = relativeA;

      relative.textX = relative.x + textD * Math.cos(relativeA);
      relative.textY = relative.y + textD * Math.sin(relativeA);
    });
  });
}

function getLinks(student) {
  const links = [];

  Object.values(student.parientes).forEach(relative => {
    const link = {};
    link.source = student.id;
    link.sourceX = student.x;
    link.sourceY = student.y;

    link.target = relative.id;
    link.targetX = relative.x;
    link.targetY = relative.y;

    link.orden = relative.orden;
    link.usada = relative.usada;
    link.grabacion_path = relative.grabacion_path;
    links.push(link);
  });

  return links;
}

///////////////////////////////////////////////////////////////////////////////
// UTILS //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
function getDistinctElements(data, accesor = d => d) {
  return [...new Set(data.map(accesor))];
}

function sanitizeId(id) {
  return id.replace(/\s+/g, "_");
}

function radToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function triangle(l) {
  const h = (l * Math.sqrt(3)) / 2;
  return `M${0} ${-(h * 2) / 3} L${l / 2} ${h / 3} L${-l / 2} ${h / 3} Z`;
}

function chunk(array, threshold) {
  const tempContainer = [];

  function cut(array, threshold) {
    if (array.length > threshold) {
      const subset = array.splice(0, threshold);
      tempContainer.push(subset);
      cut(array, threshold);
    } else {
      tempContainer.push(array);
    }
  }

  cut(array, threshold);

  return tempContainer;
}

function trimText(self, width) {
  let textLength = self.node().getComputedTextLength();
  let text = self.text();
  const padding = 2;
  while (textLength > width - 2 * padding && text.length > 0) {
    text = text.slice(0, -1);
    self.text(text + "...");
    textLength = self.node().getComputedTextLength();
  }
  return text;
}

function wrap(text, width, verticalAllignment) {
  // In order to work properly, the text must have defined attr "x" and "y"
  text.each(function (d, i, nodes) {
    const text = d3.select(nodes[i]);

    const words = text.text().split(/\s+/).reverse();

    let word;
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.15; // ems
    const x = text.attr("x");
    const y = text.attr("y") || 0;
    const dy = parseFloat(text.attr("dy"));
    let tspan = text
      .text(null)
      .append("tspan")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));

      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);

        if (verticalAllignment === "middle") {
          text
            .selectAll("tspan")
            .attr("y", y - (lineHeight * lineNumber) / 2 + "em");
        }
      }
    }
  });
}

function createGlowFilter(defs, id, stdDeviation) {
  const filter = defs
    .append("filter")
    .attr("width", "300%")
    .attr("x", "-100%")
    .attr("height", "300%")
    .attr("y", "-100%")
    .attr("id", id);

  filter
    .append("feGaussianBlur")
    .attr("class", "blur")
    .attr("stdDeviation", stdDeviation)
    .attr("result", "coloredBlur");

  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");
}

function createShadowFilter(defs, id, stdDeviation) {
  const shadow = defs.append("filter").attr("id", id).attr("height", "130%");

  shadow
    .append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", stdDeviation) // Adjust the blur radius
    .attr("result", "blur");

  shadow
    .append("feOffset")
    .attr("in", "blur")
    .attr("dx", 0.5) // Adjust the horizontal offset
    .attr("dy", 0.5) // Adjust the vertical offset
    .attr("result", "offsetBlur");

  // Add feComponentTransfer to reduce the opacity of the shadow
  const feComponentTransfer = shadow.append("feComponentTransfer");
  feComponentTransfer
    .append("feFuncA")
    .attr("type", "linear")
    .attr("slope", 0.2); // Adjust the slope to reduce the opacity

  const feMergeShadow = shadow.append("feMerge");

  feMergeShadow.append("feMergeNode").attr("in", "offsetBlur");
  feMergeShadow.append("feMergeNode").attr("in", "SourceGraphic");
}
