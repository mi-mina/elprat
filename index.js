// const dataUrl = "/grav-admin/user/assets/elPratViz2025Data.csv"
const dataUrl = "./data/elPratViz2025Data.csv";

// const audiosUrl =
//   "/grav-admin/user/pages/02.talleres/prat-2025/_piezas-viz/audios/";
const audiosUrl = "./audios/";

document.addEventListener("DOMContentLoaded", function () {
  function loadData() {
    const files = [d3.csv(dataUrl)];

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

  const transitionDuration = 1500;
  const PI = Math.PI;
  const PI2 = PI * 2;
  const PI_2 = PI / 2;
  let R1;
  let R2;
  let orderD;

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

  const txtRelativeColorLight = "#d4d4d4";
  const txtRelativeColorDark = "#8f8f8f";
  const txtOriginColor = "#7d7d7d";
  const buttonColor = "#2F2F2FFF";

  const courseColors = {
    "4º música": "#da4326",
    "4ºtE": "#e0b11b",
    "4ºtB": "#32849a",
    "3ºA": "#e9d7b3",
    "3ºB": "#99b9b6", // Add a new color
    "3ºC": "#9da768", // Add another new color
  };

  const colors = Object.values(courseColors); // Create an array of colors, for use in random color selection, if needed.

  let currentId;
  let counter = 0;
  let containerSelector = "graph";
  let velocityDecay = d3.randomUniform(0.1, 0.4)();
  let simulation;

  function init(files) {
    const dataRaw = files[0];
    const allCompositions = formatData(dataRaw);
    const numberOfCompositions = Object.keys(allCompositions).length;

    const compositionIds = d3.shuffle(
      Object.keys(allCompositions).map(d => Number(d))
    );
    currentId = compositionIds[counter];

    drawGraph(containerSelector, allCompositions);

    function drawGraph(selector, data) {
      // Stop previous simulation if any //////////////////////////////////////
      if (simulation) {
        simulation.stop(); // Stop the previous simulation
      }

      // Pause all audios
      Object.keys(audioObjects).forEach(key => {
        audioObjects[key].pause();
      });
      // Reset audioObjects
      audioObjects = {};

      ///////////////////////////////////////////////////////////////////////////
      // Set up svg /////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      const container = document.getElementById(selector);
      const svgWidth = container.clientWidth;
      const svgHeight = container.clientHeight;

      R1 = svgHeight * 0.055;
      R2 = svgHeight * 0.1;
      orderD = svgHeight * 0.05;

      const compositionPlayR = svgHeight * 0.03;
      const nextPrevR = compositionPlayR * 0.7;
      const yPosControls = R1 + R2 + 4.5 * orderD;

      const center = { x: svgWidth / 2, y: svgHeight / 2 };
      const orientation = svgWidth >= svgHeight ? "horizontal" : "vertical";

      // Clear ////////////////////////////////////////////////////////////////
      d3.select(`#${selector}`).selectAll("*").remove();

      // Create tooltip div ///////////////////////////////////////////////////
      const tooltip = d3
        .select(`#${selector}`)
        .append("div")
        .attr("id", "prat3tooltip")
        .attr(
          "class",
          "z-50 block fixed bg-gray-800 text-sm px-4 py-2 mr-8 rounded-2xl shadow-xl shadow-gray-900/50"
        )
        .style("display", "none"); // Initially hide the tooltip

      // Create the tooltip spans
      tooltip.append("span").attr("id", "tooltip-frase");
      tooltip
        .append("span")
        .attr("id", "tooltip-exp")
        .attr("class", "text-gray-500");

      // Containers ///////////////////////////////////////////////////////////
      const svg = d3
        .select(`#${selector}`)
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("class", "mh-auto")
        .style("user-select", "none");

      const chartContainer = svg
        .append("g")
        .attr("transform", d => `translate(${center.x}, ${center.y * 0.9})`);

      // Set up nodes for simulation //////////////////////////////////////////
      const nodes = Object.values(data);

      // Add empty nodes to prevent stars to move behind the current
      // node and the audio controls
      nodes.push({
        id: "controlsNode",
        simulationR: svgHeight * 0.125,
        fx: 0,
        fy: yPosControls,
      });
      nodes.push({
        id: "starNode",
        simulationR: R1 + R2 + 4 * orderD,
        fx: 0,
        fy: 0,
      });

      // Draw background simple stars /////////////////////////////////////////
      if (orientation === "horizontal") {
        nodes.forEach(d => {
          const container = chartContainer
            .append("g")
            .attr("id", `composition${d.id}`)
            .attr("transform", `translate(${center.x}, ${center.y})`);

          if (
            d.id !== "controlsNode" &&
            d.id !== "starNode" &&
            d.id != currentId
          ) {
            drawStar(container, data[d.id], orientation, false);
          }

          // Comentar. Solo para testing
          // if (d.id === "starNode") {
          //   chartContainer
          //     .append("circle")
          //     .attr("id", "starNodeCircle")
          //     .attr("cx", 0)
          //     .attr("cy", 0)
          //     .attr("r", d.simulationR)
          //     .style("fill", "none")
          //     .style("stroke", "red");
          // }
        });
      }

      // Draw complete star ///////////////////////////////////////////////////
      const starContainer = chartContainer
        .append("g")
        .attr("id", `compositionCurrent${currentId}`);
      drawStar(starContainer, data[currentId], orientation, true);

      ///////////////////////////////////////////////////////////////////////////
      // Simulation /////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      simulation = d3
        .forceSimulation(nodes)
        .alphaTarget(0.2) // stay hot
        .velocityDecay(0.7) // soft movement
        .force("x", d3.forceX().strength(0.008))
        .force("y", d3.forceY().strength(0.05))
        .force(
          "collide",
          d3
            .forceCollide()
            .radius(d => d.simulationR)
            .iterations(3)
        )
        .on("tick", ticked);

      function ticked() {
        nodes
          .filter(d => d.id !== currentId)
          .forEach(d => {
            d3.select(`#composition${d.id}`).attr(
              "transform",
              `translate(${d.x}, ${d.y})`
            );
          });
      }

      // Glow ////////////////////////////////////////////////////////////////
      const defs = svg.append("defs");
      createGlowFilter(defs, "glow", 5);
      createShadowFilter(defs, "drop-shadow", 1);

      ///////////////////////////////////////////////////////////////////////////
      // Draw ///////////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      // Draw functions /////////////////////////////////////////////////////////
      function drawStar(container, starData, orientation, complete) {
        const color = courseColors[starData.curso] || "#808080"; // Default to gray if course not found
        const transparency = d3.randomUniform(0.05, 0.3)();

        getCoordinates(starData, orientation, complete);

        // Containers ///////////////////////////////////////////////////////////
        const starContainer = container
          .append("g")
          .attr(
            "id",
            complete ? `starCurrent${starData.id}` : `star${starData.id}`
          )
          .style("opacity", 0);

        starContainer
          .transition()
          .duration(transitionDuration)
          .style("opacity", complete ? 1 : transparency);

        // Students /////////////////////////////////////////////////////////////
        const studentGroup = starContainer
          .selectAll(".studentGroup")
          .data(Object.values(starData.alumnos))
          .join("g")
          .attr("class", "studentGroup");

        // Big translucent circles
        studentGroup
          .append("circle")
          .attr("class", `student-aureola-${starData.id}`)
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .attr("r", d => d.r * 2.8)
          .style("fill", complete ? chroma(color).darken(1.5) : color)
          .style("fill-opacity", 0.08)
          .style("filter", "url(#glow)")
          .style("pointer-events", "none")
          .style("display", "none");

        studentGroup
          .append("circle")
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .attr("r", d => d.r)
          .style("fill", complete ? chroma(color).darken(1.5) : color)
          .style("filter", "url(#glow)");

        if (complete) {
          const studentNameTextSize =
            svgHeight * 0.02 > 12 ? svgHeight * 0.02 : 12;

          studentGroup
            .append("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font", `${studentNameTextSize}px arial`)
            .style("stroke", "#121212")
            .style("stroke-width", "2px")
            .text(d => d.id);

          studentGroup
            .append("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font", `${studentNameTextSize}px arial`)
            .style("fill", txtRelativeColorLight)
            .text(d => d.id);
        }

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
            d.usada === 1 ? chroma(color).darken(1.5) : chroma(color).darken(2)
          )
          .style("stroke-width", d => (d.usada === 1 && complete ? 3 : 1))
          .lower();

        // Parientes ////////////////////////////////////////////////////////////
        const relativeGroup = studentGroup
          .selectAll(".relativeGroup")
          .data(d => Object.values(d.parientes))
          .join("g")
          .attr("class", "relativeGroup")
          .style("cursor", d =>
            d.usada === 1 && complete ? "pointer" : "default"
          )
          .call(g => {
            if (complete) showTooltip(g);
          });

        function showTooltip(g) {
          const tooltip = d3.select("#prat3tooltip");
          const tooltipFrase = tooltip.select("#tooltip-frase");
          const tooltipExp = tooltip.select("#tooltip-exp");

          g.on("mouseover", function (event, d) {
            // Check if there's content AND d.usada === 1
            if ((d.frase || d.significado) && d.usada === 1) {
              tooltip.style("display", "block");

              tooltipFrase.text(d.frase || ""); // Set frase or empty string if undefined

              if (d.significado) {
                if (d.frase) {
                  tooltipExp.text(": " + d.significado); // Add colon if frase exists
                } else {
                  tooltipExp.text(d.significado); // No colon if only significado exists
                }
              } else {
                tooltipExp.text(""); // Clear exp if significado is undefined
              }
            } else {
              tooltip.style("display", "none"); // Hide if no content or d.usada !== 1
            }
          })
            .on("mousemove", function (event) {
              tooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.clientY + 10 + "px");
            })
            .on("mouseout", function () {
              tooltip.style("display", "none");
            });
        }

        const relativeWithAudio = relativeGroup.filter(d => d.usada === 1);

        // Big translucent circles
        relativeWithAudio
          .append("circle")
          .attr("id", d => `aureola-${sanitizeId(d.id)}`)
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .attr("r", d => d.r * 2.8)
          .style("fill", complete ? chroma(color).darken(1.5) : color)
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
            complete
              ? d.usada === 1
                ? chroma(color).darken(1.5)
                : chroma(color).darken(2)
              : color
          )
          .style("filter", "url(#glow)");

        if (complete) {
          // play icon in each relative with audio
          relativeWithAudio.each(function (d) {
            const sanitizedId = sanitizeId(d.id);
            const relativeElement = d3.select(this);

            const audio = new Audio(`${audiosUrl}${d.grabacion_path}`);
            audioObjects[sanitizedId] = audio;

            // Add ended event listener
            audio.addEventListener("ended", function () {
              d3.select("#playIcon" + sanitizedId).style("display", "block");
              d3.select("#pauseIcon" + sanitizedId).style("display", "none");
              d3.select(`#aureola-${sanitizedId}`).style("display", "none");
            });

            drawPlayPauseIcon(relativeElement, d.x, d.y, d.r, sanitizedId);
            handlePlayPause(relativeElement, sanitizedId, audioObjects);
          });

          const relativeTextsGroup = relativeGroup
            .append("g")
            .attr("transform", d => `translate(${d.textX}, ${d.textY})`);

          const relativeTextSize =
            svgHeight * 0.0175 > 12 ? svgHeight * 0.0175 : 12;
          const originsTextSize =
            svgHeight * 0.0155 > 10 ? svgHeight * 0.0155 : 10;

          relativeTextsGroup
            .append("text")
            .attr("transform", function (d) {
              return `rotate(${
                d.a > PI_2 && d.a < PI_2 * 3
                  ? radToDegrees(d.a + PI)
                  : radToDegrees(d.a)
              })`;
            })
            .attr("y", -relativeTextSize / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d =>
              d.a > PI_2 && d.a < PI_2 * 3 ? "end" : "start"
            )
            .style("font", `${relativeTextSize}px arial`)
            .style("fill", d =>
              d.usada == 1 ? txtRelativeColorLight : txtRelativeColorDark
            )
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
            .attr("y", relativeTextSize / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d =>
              d.a > PI_2 && d.a < PI_2 * 3 ? "end" : "start"
            )
            .style("font", `${originsTextSize}px arial`)
            .style("fill", txtOriginColor)
            .text(d => d.origen);
        }

        /////////////////////////////////////////////////////////////////////////
        // Audio composition controls ///////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////
        if (complete) {
          const piezaId = starData.id;
          const progressBarWidth = compositionPlayR * 7;
          const progressBarHeight = 2;
          const timeHeight = compositionPlayR * 0.7;
          const timeWidth = compositionPlayR * 2;
          const horPadding = compositionPlayR / 2;
          let progress = 0;
          let mouseDownOnSlider = false;

          // Add composition audio
          audioObjects[piezaId] = new Audio(
            `${audiosUrl}${starData.pieza_path}`
          );

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
            .style("fill", buttonColor);

          drawPlayPauseIcon(
            compositionPlayPauseButtonContainer,
            0,
            0,
            compositionPlayR,
            piezaId
          );

          handlePlayPause(
            compositionPlayPauseButtonContainer,
            piezaId,
            audioObjects
          );

          // Next button //////////////////////////////////////////////////////////
          const compositionNextButtonContainer = audioControls
            .append("g")
            .attr("id", "nextButton" + piezaId)
            .attr("transform", `translate(${compositionPlayR * 2.4}, 0)`);

          compositionNextButtonContainer
            .append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", nextPrevR)
            .style("fill", buttonColor);

          drawNextPreviousIcon(
            compositionNextButtonContainer,
            nextPrevR,
            "next"
          );

          // Previous button //////////////////////////////////////////////////////
          const compositionPreviousButtonContainer = audioControls
            .append("g")
            .attr("id", "previousButton" + piezaId)
            .attr("transform", `translate(${-compositionPlayR * 2.4}, 0)`);

          compositionPreviousButtonContainer
            .append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", nextPrevR)
            .style("fill", buttonColor);

          drawNextPreviousIcon(
            compositionPreviousButtonContainer,
            nextPrevR,
            "previous"
          );

          // Add progress bar /////////////////////////////////////////////////
          const progressBarContainer = audioControls
            .append("g")
            .attr("id", "progressBarContainer")
            .attr(
              "transform",
              `translate(${-progressBarWidth / 2}, ${compositionPlayR * 1.75})`
            );

          progressBarContainer
            .append("rect")
            .attr("width", progressBarWidth)
            .attr("height", progressBarHeight)
            .style("fill", "grey");

          const progressCircle = progressBarContainer
            .append("circle")
            .attr("id", "progress" + piezaId)
            .attr("cx", progressBarWidth * progress)
            .attr("cy", progressBarHeight / 2)
            .attr("r", 4)
            .style("fill", "white")
            .style("cursor", "pointer");

          progressBarContainer
            .append("rect")
            .attr("x", -timeWidth - horPadding)
            .attr("y", -timeHeight / 2 + progressBarHeight / 2)
            .attr("width", timeWidth)
            .attr("height", timeHeight)
            .attr("rx", timeHeight / 2)
            .attr("ry", timeHeight / 2)
            .style("fill", "grey")
            .style("fill-opacity", 0.1);

          progressBarContainer
            .append("rect")
            .attr("x", progressBarWidth + horPadding)
            .attr("y", -timeHeight / 2 + progressBarHeight / 2)
            .attr("width", timeWidth)
            .attr("height", timeHeight)
            .attr("rx", timeHeight / 2)
            .attr("ry", timeHeight / 2)
            .style("fill", "grey")
            .style("fill-opacity", 0.1);

          progressBarContainer
            .append("text")
            .attr("id", "currentTime" + piezaId)
            .attr("x", -horPadding - timeWidth / 2)
            .attr("y", progressBarHeight / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("fill", "grey")
            .style("font", `${compositionPlayR * 0.5}px arial`)
            .text("00:00");

          progressBarContainer
            .append("text")
            .attr("id", "duration" + piezaId)
            .attr("x", progressBarWidth + horPadding + timeWidth / 2)
            .attr("y", progressBarHeight / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("fill", "grey")
            .style("font", `${compositionPlayR * 0.5}px arial`)
            .text("00:00");

          audioObjects[piezaId].addEventListener("loadeddata", () => {
            progress = 0;
            d3.select("#duration" + piezaId).text(
              fmtTime(audioObjects[piezaId].duration)
            );
          });

          audioObjects[piezaId].addEventListener("timeupdate", () => {
            if (!mouseDownOnSlider) {
              progress = audioObjects[piezaId]
                ? audioObjects[piezaId].duration
                  ? audioObjects[piezaId].currentTime /
                    audioObjects[piezaId].duration
                  : 0
                : 0;

              d3.select("#progress" + piezaId).attr(
                "cx",
                progressBarWidth * progress
              );
              if (audioObjects[piezaId])
                d3.select("#currentTime" + piezaId).text(
                  fmtTime(audioObjects[piezaId].currentTime)
                );
              if (audioObjects[piezaId])
                d3.select("#duration" + piezaId).text(
                  fmtTime(audioObjects[piezaId].duration)
                );

              const randR = d3.randomInt(R1 + R2 + 4 * orderD)();
              nodes.filter(d => d.id === "starNode")[0].simulationR = randR;

              // Comentar. Es solo para ver el tamaño del nodo central
              // d3.select("#starNodeCircle").attr("r", randR);

              simulation.nodes(nodes);
              simulation.alpha(0.1).velocityDecay(velocityDecay).restart();
            }
          });

          // Add drag functionality to the progress bar
          progressCircle.on("mousedown", function (event) {
            mouseDownOnSlider = true;
            const mouseX = d3.pointer(event, progressBarContainer.node())[0];
            updateProgress(mouseX);
          });

          svg.on("mousemove", function (event) {
            if (mouseDownOnSlider) {
              const mouseX = d3.pointer(event, progressBarContainer.node())[0];
              updateProgress(mouseX);
            }
          });

          svg.on("mouseup", function () {
            if (mouseDownOnSlider) {
              mouseDownOnSlider = false;
            }
          });

          function updateProgress(mouseX) {
            const clampedX = Math.max(0, Math.min(mouseX, progressBarWidth));
            const newProgress = clampedX / progressBarWidth;
            progressCircle.attr("cx", clampedX);
            audioObjects[piezaId].currentTime =
              newProgress * audioObjects[piezaId].duration;
          }

          // Add info /////////////////////////////////////////////////////////////
          // Centro
          const centroText = audioControls
            .append("text")
            .attr("x", 0)
            .attr("y", compositionPlayR * 3.2)
            .attr("text-anchor", "middle")
            .style("font", `${compositionPlayR * 0.7}px arial`)
            .style("fill", txtRelativeColorLight)
            .text(starData.centro);

          // Docente + Curso
          const docenteText = audioControls
            .append("text")
            .attr("x", 0)
            .attr("y", compositionPlayR * 4)
            .attr("text-anchor", "middle")
            .style("font", `${compositionPlayR * 0.6}px arial`)
            .style("fill", txtRelativeColorDark);

          docenteText
            .append("tspan")
            .style("fill", color)
            .text(`${starData.curso}`);

          docenteText.append("tspan").text(` - (Prof. ${starData.docente})`);

          // Project URL Link
          audioControls
            .append("a")
            .attr("xlink:href", starData.project_url)
            .attr("target", "_blank") // Open in a new tab
            .append("text")
            .attr("x", 0)
            .attr("y", compositionPlayR * 4.8) // Position below docenteText
            .attr("text-anchor", "middle")
            .style("font", `${compositionPlayR * 0.6}px arial`)
            .style("fill", txtOriginColor) // chroma(color).darken(2)) // Use the same color as the course
            .text(">> explora en play");

          // Add event listeners //////////////////////////////////////////////////
          d3.select("#nextButton" + piezaId).on("click", function () {
            // Pause all  audios
            Object.keys(audioObjects).forEach(key => {
              audioObjects[key].pause();
            });
            // Reset audioObjects
            audioObjects = {};

            // Update ids
            previousId = currentId;
            counter = counter >= numberOfCompositions - 1 ? 0 : counter + 1;
            currentId = compositionIds[counter];

            // Erase current star from background after the transition
            d3.select(`#composition${currentId}`)
              .select(`#star${currentId}`)
              .transition()
              .duration(transitionDuration)
              .style("opacity", 0)
              .on("end", function () {
                // Remove the element after the transition ends
                d3.select(this).remove();
              });

            // Redraw previous star in background
            drawStar(
              d3.select(`#composition${previousId}`),
              data[previousId],
              orientation,
              false
            );

            setTimeout(() => {
              velocityDecay = d3.randomUniform(0.1, 0.4)();
              nodes.filter(d => d.id === "starNode")[0].simulationR =
                R1 + R2 + 4 * orderD;
              d3.select("#starNodeCircle").attr("r", R1 + R2 + 4 * orderD);
              simulation.nodes(nodes);
              simulation.alpha(0.1).velocityDecay(velocityDecay).restart();
            }, 200);

            // Erase previous complete star
            d3.select(`#starCurrent${previousId}`)
              .transition()
              .duration(transitionDuration)
              .style("opacity", 0)
              .on("end", function () {
                // Remove the element after the transition ends
                d3.select(this.parentNode).remove();
              });

            // Draw current complete star
            const starContainer = chartContainer
              .append("g")
              .attr("id", `compositionCurrent${currentId}`);
            drawStar(starContainer, data[currentId], orientation, true);
          });

          d3.select("#previousButton" + piezaId).on("click", function () {
            // Pause all  audios
            Object.keys(audioObjects).forEach(key => {
              audioObjects[key].pause();
            });
            // Reset audioObjects
            audioObjects = {};

            // Update star
            previousId = currentId;
            counter = counter <= 0 ? numberOfCompositions - 1 : counter - 1;
            currentId = compositionIds[counter];

            // Erase current star from background after the transition
            d3.select(`#composition${currentId}`)
              .select(`#star${currentId}`)
              .transition()
              .duration(transitionDuration)
              .style("opacity", 0)
              .on("end", function () {
                // Remove the element after the transition ends
                d3.select(this).remove();
              });

            // Redraw previous star in background
            drawStar(
              d3.select(`#composition${previousId}`),
              data[previousId],
              orientation,
              false
            );

            setTimeout(() => {
              velocityDecay = d3.randomUniform(0.1, 0.4)();
              nodes.filter(d => d.id === "starNode")[0].simulationR =
                R1 + R2 + 4 * orderD;
              d3.select("#starNodeCircle").attr("r", R1 + R2 + 4 * orderD);
              simulation.nodes(nodes);
              simulation.alpha(0.1).velocityDecay(velocityDecay).restart();
            }, 200);

            // Erase previous complete star
            d3.select(`#starCurrent${previousId}`)
              .transition()
              .duration(transitionDuration)
              .style("opacity", 0)
              .on("end", function () {
                // Remove the element after the transition ends
                d3.select(this.parentNode).remove();
              });

            // Draw current complete star
            const starContainer = chartContainer
              .append("g")
              .attr("id", `compositionCurrent${currentId}`);
            drawStar(starContainer, data[currentId], orientation, true);
          });
        }
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

      function handlePlayPause(container, id, audioObjects) {
        container.on("click", function () {
          const audio = audioObjects[id];

          if (!audio) {
            console.error(`Audio object for ID ${id} not found.`);
            return;
          }

          if (audio.paused) {
            // Pause all other audios
            Object.keys(audioObjects).forEach(key => {
              if (key !== id) {
                audioObjects[key].pause();
                d3.select("#playIcon" + key).style("display", "block");
                d3.select("#pauseIcon" + key).style("display", "none");
                d3.select(`#aureola-${key}`).style("display", "none");
                d3.selectAll(`.student-aureola-${key}`).style(
                  "display",
                  "none"
                );
              }
            });
            audio.play();
            d3.select("#playIcon" + id).style("display", "none");
            d3.select("#pauseIcon" + id).style("display", "block");
            d3.select(`#aureola-${id}`).style("display", "block");
            d3.selectAll(`.student-aureola-${id}`).style("display", "block");

            // velocityDecay = d3.randomUniform(0.1, 0.4)();
          } else {
            audio.pause();
            d3.select("#playIcon" + id).style("display", "block");
            d3.select("#pauseIcon" + id).style("display", "none");
            d3.select(`#aureola-${id}`).style("display", "none");
            d3.selectAll(`.student-aureola-${id}`).style("display", "none");

            setTimeout(() => {
              nodes.filter(d => d.id === "starNode")[0].simulationR =
                R1 + R2 + 4 * orderD;
              simulation.nodes(nodes);
              simulation.alpha(0.1).velocityDecay(0.7).restart();
            }, 200);
          }
        });
      }
    }

    // Resize event /////////////////////////////////////////////////////////////
    window.addEventListener("resize", function () {
      drawGraph(containerSelector, allCompositions);
    });

    // // Define the full screen and close buttons again but different from viz-modal.js to control de viz draw
    // const vizModalButtonDraw = document.getElementById("full-screen-viz-modal");
    // const closeVizModalBtnErase = document.getElementById("close-viz-modal");

    // // Draw viz in opened modal
    // if (vizModalButtonDraw) {
    //   vizModalButtonDraw.addEventListener("click", function () {
    //     requestAnimationFrame(function () {
    //       requestAnimationFrame(function () {
    //         containerSelector = "graph-modal";
    //         d3.select(`#graph`).selectAll("*").remove();
    //         drawGraph(containerSelector, allCompositions);
    //       });
    //     });
    //   });
    // }
    // // Close modal
    // closeVizModalBtnErase.addEventListener("click", function () {
    //   containerSelector = "graph";
    //   d3.select(`#graph-modal`).selectAll("*").remove();
    //   drawGraph(containerSelector, allCompositions);
    // });
  }

  ///////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS ///////////////////////////////////////////////////////////////////
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
        project_url,
      } = d;

      if (!data[id]) {
        data[id] = {
          id,
          centro,
          docente,
          curso,
          pieza_path,
          project_url,
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

  function getCoordinates(data, orientation, complete) {
    const studentR = orderD / 2;
    const relativeR = studentR * 0.45;
    const relativePlayR = studentR * 0.66;

    const initA = complete
      ? orientation === "horizontal"
        ? 0
        : PI_2
      : d3.randomUniform(0, PI2)();

    const factor = complete ? 1 : d3.randomUniform(0.2, 0.4)();
    data.simulationR = complete ? 0 : (R1 + R2 + 4 * orderD) * factor;

    Object.values(data.alumnos).forEach((student, i, studentArray) => {
      const numberOfStudents = studentArray.length;
      const maxfanA = numberOfStudents === 2 ? PI2 * 0.45 : PI2 * 0.33;
      const initRelativeA = PI2 * 0.06;
      let fanA;

      const studenA = initA + (PI2 / studentArray.length) * i;
      student.x = R1 * Math.cos(studenA) * factor;
      student.y = R1 * Math.sin(studenA) * factor;
      student.r = studentR * factor;
      student.a = studenA;

      Object.values(student.parientes).forEach((relative, i, relativeArray) => {
        fanA =
          (relativeArray.length - 1) * initRelativeA > maxfanA
            ? maxfanA
            : initRelativeA * (relativeArray.length - 1);

        const textD = studentR;
        const initA = studenA - fanA / 2;
        const relativeA =
          relativeArray.length === 1
            ? initA + fanA / 2
            : initA + (fanA / (relativeArray.length - 1)) * i;

        const orden = relative.orden ? relative.orden : 2;
        // if (!relative.orden)
        //   console.log(
        //     "Alerta! No se ha encontrado orden para el pariente: ",
        //     relative
        //   );

        relative.x =
          student.x + (R2 + orderD * orden) * Math.cos(relativeA) * factor;
        relative.y =
          student.y + (R2 + orderD * orden) * Math.sin(relativeA) * factor;
        relative.r =
          relative.usada === 1 ? relativePlayR * factor : relativeR * factor;
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

  function fmtTime(s) {
    const d = new Date(0);

    if (s > 0) {
      d.setSeconds(s % 60);
      d.setMinutes(s / 60);
    }

    return d.toISOString().slice(14, 19);
  }
});
