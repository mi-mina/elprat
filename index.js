// https://mi-mina.github.io/????

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
const windowWidth = document.getElementById("graph").clientWidth;
const svgWidth = 800 > windowWidth ? windowWidth : 800;
const svgHeight = svgWidth;
const center = { x: svgWidth / 2, y: svgHeight / 2 };
const duration = 1500;
const halfDuration = 750;

const order = {
  Yo: 1,
  Hermano: 1,
  Hermana: 1,
  Primo: 1,
  Prima: 1,
  Padre: 2,
  Madre: 2,
  Tío: 2,
  Tía: 2,
  Abuelo: 3,
  Abuela: 3,
  Bisabuelo: 4,
  Bisabuela: 4
};

const currentId = 1;

function init(files) {
  const dataRaw = files[0];
  console.log("dataRaw", dataRaw);

  // Containers ////////////////////////////////////////////////////////////////
  const svg = d3
    .select("#graph")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("class", "mh-auto")
    .style("user-select", "none");

  const chartContainer = svg
    .append("g")
    .attr("transform", d => `translate(${center.x}, ${center.y})`);

  // Glow ////////////////////////////////////////////////////////////////
  const defs = svg.append("defs");

  const filter = defs
    .append("filter")
    .attr("width", "300%")
    .attr("x", "-100%")
    .attr("height", "300%")
    .attr("y", "-100%")
    .attr("id", "glow");

  filter
    .append("feGaussianBlur")
    .attr("class", "blur")
    .attr("stdDeviation", "5")
    .attr("result", "coloredBlur");

  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  // Set up data //////////////////////////////////////////////////////////////
  const allData = formatData(dataRaw);
  const starData = allData[currentId];

  // Draw /////////////////////////////////////////////////////////////////////
  drawStar(starData);

  // Draw functions ///////////////////////////////////////////////////////////
  function drawStar(data) {
    console.log("star data", data);

    getCoordinates(data);

    // Play icon
    drawPlayIcon(chartContainer);

    const studentGroup = chartContainer
      .selectAll(".studentGroup")
      .data(Object.values(data.alumnos))
      .join("g")
      .attr("class", "studentGroup");

    studentGroup
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .style("fill", "red");

    const relativeGroup = studentGroup
      .selectAll(".relativeGroup")
      .data(d => {
        return Object.values(d.parientes);
      })
      .join("g")
      .attr("class", "relativeGroup");

    relativeGroup
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .style("fill", "pink");


  }

  function drawPlayIcon(container) {
    const playR = 20;

    const playContainer = container
      .append("g");

    playContainer.append("circle")
      .attr("id", "playComposition")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", playR)
      .style("fill", "grey");

    playContainer
      .append("path")
      .attr("id", "playIcon")
      .attr("transform", "rotate(90)")
      .attr("d", triangle(playR))
      .attr("pointer-events", "none")
      .style("fill", "white");
  }
}



///////////////////////////////////////////////////////////////////////////////
// FUNTIONS ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
function formatData(dataRaw) {
  const data = {};
  dataRaw.forEach((d, i) => {
    const { id, alumno, pariente, origen, grabacion, centro, composicion } = d;
    const parienteId = `${alumno}-pariente-${i}`;

    if (!data[id]) {
      data[id] = {
        id,
        centro,
        composicion,
        alumnos: {},
      };
    }

    if (!data[id].alumnos[alumno]) {
      data[id].alumnos[alumno] = {
        id: alumno,
        parientes: {},
      };
    }

    if (!data[id].alumnos[alumno].parientes[parienteId]) {
      data[id].alumnos[alumno].parientes[parienteId] = {
        id: parienteId,
        pariente,
        origen,
        orden: order[pariente],
        grabacion,
      };
    }
  });
  return data;
}

function getCoordinates(data) {

  Object.values(data.alumnos).forEach((student, i, studentArray) => {
    const innerR = 80;
    const a = 2 * Math.PI / studentArray.length * i;

    student.x = innerR * Math.cos(a);
    student.y = innerR * Math.sin(a);
    student.r = 8;

    Object.values(student.parientes).forEach((relative, i, relativeArray) => {
      const dist = 50;
      console.log("relative", relative);
      const a = 2 * Math.PI / 3 / (relativeArray.length - 1) * i;
      relative.x = student.x + dist * Math.cos(a);
      relative.y = student.y + dist * Math.sin(a);
      relative.r = 6;


    });

  });

}

function getNodes(data) {
  const nodes = [];
  const students = Object.keys(data.alumnos);

  students.forEach(studentId => {
    // Student nodes
    const studentNode = {};
    studentNode.id = studentId;
    studentNode.type = "alumno";
    nodes.push(studentNode);

    // Relative nodes
    const parientes = Object.keys(data.alumnos[studentId].parientes);
    parientes.forEach(relativeId => {
      const relative = data.alumnos[studentId].parientes[relativeId];
      const relativeNode = {};
      relativeNode.id = relativeId;
      relativeNode.type = "pariente";
      relativeNode.pariente = relative.pariente;
      relativeNode.origen = relative.origen;
      relativeNode.grabacion = relative.grabacion;
      relativeNode.orden = order[relative.pariente];
      nodes.push(relativeNode);
    }
    );
  });
  return nodes;
}

function getLinks(data) {
  const links = [];

  Object.values(data.alumnos).forEach(student => {
    Object.values(student.parientes).forEach(relative => {
      const link = {};
      link.source = student.id;
      link.target = relative.id;
      link.orden = relative.orden;
      links.push(link);
    });

  });


  return links;
}




///////////////////////////////////////////////////////////////////////////////
// UTILS //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
function getDistinctElements(data, accesor = d => d) {
  return [...new Set(data.map(accesor))];
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
