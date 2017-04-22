var astar;
(function (astar) {
    (function (GraphNodeType) {
        GraphNodeType[GraphNodeType["WALL"] = 0] = "WALL";
        GraphNodeType[GraphNodeType["OPEN"] = 1] = "OPEN";
    })(astar.GraphNodeType || (astar.GraphNodeType = {}));
    var GraphNodeType = astar.GraphNodeType;
    var Graph = (function () {
        function Graph(grid) {
            this.elements = grid;
            var nodes = [];
            var row, rowLength, len = grid.length;
            for (var x = 0; x < len; ++x) {
                row = grid[x];
                rowLength = row.length;
                nodes[x] = new Array(rowLength);
                for (var y = 0; y < rowLength; ++y) {
                    nodes[x][y] = new GraphNode(x, y, row[y]);
                }
            }
            this.nodes = nodes;
        }
        Graph.prototype.toString = function () {
            var graphString = "\n";
            var nodes = this.nodes;
            var rowDebug, row, y, l;
            for (var x = 0, len = nodes.length; x < len;) {
                rowDebug = "";
                row = nodes[x++];
                for (y = 0, l = row.length; y < l;) {
                    rowDebug += row[y++].type + " ";
                }
                graphString = graphString + rowDebug + "\n";
            }
            return graphString;
        };
        return Graph;
    })();
    astar.Graph = Graph;
    var GraphNode = (function () {
        function GraphNode(x, y, type) {
            this.data = {};
            this.x = x;
            this.y = y;
            this.pos = { x: x, y: y };
            this.type = type;
        }
        GraphNode.prototype.toString = function () {
            return "[" + this.x + " " + this.y + "]";
        };
        GraphNode.prototype.isWall = function () {
            return this.type == GraphNodeType.WALL;
        };
        return GraphNode;
    })();
    astar.GraphNode = GraphNode;
    var BinaryHeap = (function () {
        function BinaryHeap(scoreFunction) {
            this.content = [];
            this.scoreFunction = scoreFunction;
        }
        BinaryHeap.prototype.push = function (node) {
            this.content.push(node);
            this.sinkDown(this.content.length - 1);
        };
        BinaryHeap.prototype.pop = function () {
            var result = this.content[0];
            var end = this.content.pop();
            if (this.content.length > 0) {
                this.content[0] = end;
                this.bubbleUp(0);
            }
            return result;
        };
        BinaryHeap.prototype.remove = function (node) {
            var i = this.content.indexOf(node);
            var end = this.content.pop();
            if (i !== this.content.length - 1) {
                this.content[i] = end;
                if (this.scoreFunction(end) < this.scoreFunction(node))
                    this.sinkDown(i);
                else
                    this.bubbleUp(i);
            }
        };
        BinaryHeap.prototype.size = function () {
            return this.content.length;
        };
        BinaryHeap.prototype.rescoreElement = function (node) {
            this.sinkDown(this.content.indexOf(node));
        };
        BinaryHeap.prototype.sinkDown = function (n) {
            var element = this.content[n];
            while (n > 0) {
                var parentN = ((n + 1) >> 1) - 1, parent = this.content[parentN];
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                    this.content[parentN] = element;
                    this.content[n] = parent;
                    n = parentN;
                }
                else {
                    break;
                }
            }
        };
        BinaryHeap.prototype.bubbleUp = function (n) {
            var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);
            while (true) {
                var child2N = (n + 1) << 1, child1N = child2N - 1;
                var swap = null;
                if (child1N < length) {
                    var child1 = this.content[child1N], child1Score = this.scoreFunction(child1);
                    if (child1Score < elemScore)
                        swap = child1N;
                }
                if (child2N < length) {
                    var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap === null ? elemScore : child1Score))
                        swap = child2N;
                }
                if (swap !== null) {
                    this.content[n] = this.content[swap];
                    this.content[swap] = element;
                    n = swap;
                }
                else {
                    break;
                }
            }
        };
        return BinaryHeap;
    })();
    astar.BinaryHeap = BinaryHeap;
    var AStar = (function () {
        function AStar(grid, disablePoints, enableCost) {
            this.grid = [];
            for (var x = 0, xl = grid.length; x < xl; x++) {
                this.grid[x] = [];
                for (var y = 0, yl = grid[x].length; y < yl; y++) {
                    var cost = (typeof grid[x][y] == "number") ? grid[x][y] : grid[x][y].type;
                    if (cost > 1 && !enableCost)
                        cost = 1;
                    this.grid[x][y] = {
                        org: grid[x][y],
                        f: 0,
                        g: 0,
                        h: 0,
                        cost: cost,
                        visited: false,
                        closed: false,
                        pos: {
                            x: x,
                            y: y
                        },
                        parent: null
                    };
                }
            }
            if (disablePoints !== undefined) {
                for (var i = 0; i < disablePoints.length; i++)
                    this.grid[disablePoints[i].x][disablePoints[i].y].cost = 0;
            }
        }
        AStar.prototype.heap = function () {
            return new BinaryHeap(function (node) {
                return node.f;
            });
        };
        AStar.prototype._find = function (org) {
            for (var x = 0; x < this.grid.length; x++)
                for (var y = 0; y < this.grid[x].length; y++)
                    if (this.grid[x][y].org == org)
                        return this.grid[x][y];
        };
        AStar.prototype._search = function (start, end, diagonal, heuristic) {
            heuristic = heuristic || this.manhattan;
            diagonal = !!diagonal;
            var openHeap = this.heap();
            var _start, _end;
            if (start.x !== undefined && start.y !== undefined)
                _start = this.grid[start.x][start.y];
            else
                _start = this._find(start);
            if (end.x !== undefined && end.y !== undefined)
                _end = this.grid[end.x][end.y];
            else
                _end = this._find(end);
            if (AStar.NO_CHECK_START_POINT == false && _start.cost <= 0)
                return [];
            openHeap.push(_start);
            while (openHeap.size() > 0) {
                var currentNode = openHeap.pop();
                if (currentNode === _end) {
                    var curr = currentNode;
                    var ret = [];
                    while (curr.parent) {
                        ret.push(curr);
                        curr = curr.parent;
                    }
                    return ret.reverse();
                }
                currentNode.closed = true;
                var neighbors = this.neighbors(currentNode, diagonal);
                for (var i = 0, il = neighbors.length; i < il; i++) {
                    var neighbor = neighbors[i];
                    if (neighbor.closed || neighbor.cost <= 0) {
                        continue;
                    }
                    var gScore = currentNode.g + neighbor.cost;
                    var beenVisited = neighbor.visited;
                    if (!beenVisited || gScore < neighbor.g) {
                        neighbor.visited = true;
                        neighbor.parent = currentNode;
                        neighbor.h = neighbor.h || heuristic(neighbor.pos, _end.pos);
                        neighbor.g = gScore;
                        neighbor.f = neighbor.g + neighbor.h;
                        if (!beenVisited) {
                            openHeap.push(neighbor);
                        }
                        else {
                            openHeap.rescoreElement(neighbor);
                        }
                    }
                }
            }
            return [];
        };
        AStar.search = function (grid, start, end, disablePoints, diagonal, heuristic) {
            var astar = new AStar(grid, disablePoints);
            return astar._search(start, end, diagonal, heuristic);
        };
        AStar.prototype.manhattan = function (pos0, pos1) {
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        };
        AStar.prototype.neighbors = function (node, diagonals) {
            var grid = this.grid;
            var ret = [];
            var x = node.pos.x;
            var y = node.pos.y;
            if (grid[x - 1] && grid[x - 1][y]) {
                ret.push(grid[x - 1][y]);
            }
            if (grid[x + 1] && grid[x + 1][y]) {
                ret.push(grid[x + 1][y]);
            }
            if (grid[x] && grid[x][y - 1]) {
                ret.push(grid[x][y - 1]);
            }
            if (grid[x] && grid[x][y + 1]) {
                ret.push(grid[x][y + 1]);
            }
            if (diagonals) {
                if (grid[x - 1] && grid[x - 1][y - 1]) {
                    ret.push(grid[x - 1][y - 1]);
                }
                if (grid[x + 1] && grid[x + 1][y - 1]) {
                    ret.push(grid[x + 1][y - 1]);
                }
                if (grid[x - 1] && grid[x - 1][y + 1]) {
                    ret.push(grid[x - 1][y + 1]);
                }
                if (grid[x + 1] && grid[x + 1][y + 1]) {
                    ret.push(grid[x + 1][y + 1]);
                }
            }
            return ret;
        };
        AStar.NO_CHECK_START_POINT = false;
        return AStar;
    })();
    astar.AStar = AStar;
})(astar || (astar = {}));
window.log = function () {
    if (this.console) {
        console.log(Array.prototype.slice.call(arguments));
    }
};
var generateRandom = function (width, height, wallFrequency) {
    var nodes = [];
    for (var x = 0; x < width; x++) {
        var nodeRow = [];
        var gridRow = [];
        for (var y = 0; y < height; y++) {
            var isWall = Math.floor(Math.random() * (1 / wallFrequency));
            if (isWall == 0) {
                nodeRow.push(astar.GraphNodeType.WALL);
            }
            else {
                nodeRow.push(astar.GraphNodeType.OPEN);
            }
        }
        nodes.push(nodeRow);
    }
    return new Graph(nodes);
};
$(function () {
    var $grid = $("#search_grid");
    var $selectWallFrequency = $("#selectWallFrequency");
    var $selectGridSize = $("#selectGridSize");
    var $checkDebug = $("#checkDebug");
    var $searchDiagonal = $("#searchDiagonal");
    var opts = {
        wallFrequency: $selectWallFrequency.val(),
        gridSize: $selectGridSize.val(),
        debug: $checkDebug.is("checked"),
        diagonal: $searchDiagonal.is("checked")
    };
    var grid = new GraphSearch($grid, opts, astar.AStar.search);
    $("#btnGenerate").click(function () {
        grid.initialize();
    });
    $selectWallFrequency.change(function () {
        grid.setOption({ wallFrequency: $(this).val() });
        grid.initialize();
    });
    $selectGridSize.change(function () {
        grid.setOption({ gridSize: $(this).val() });
        grid.initialize();
    });
    $checkDebug.change(function () {
        grid.setOption({ debug: $(this).is(":checked") });
    });
    $searchDiagonal.change(function () {
        grid.setOption({ diagonal: $(this).is(":checked") });
    });
    $("#generateWeights").click(function () {
        if ($("#generateWeights").prop("checked")) {
            $('#weightsKey').slideDown();
        }
        else {
            $('#weightsKey').slideUp();
        }
    });
});
var css = { start: "start", finish: "finish", wall: "wall", active: "active" };
function GraphSearch($graph, options, implementation) {
    this.$graph = $graph;
    this.search = implementation;
    this.opts = $.extend({ wallFrequency: .1, debug: true, gridSize: 10 }, options);
    this.initialize();
}
GraphSearch.prototype.setOption = function (opt) {
    this.opts = $.extend(this.opts, opt);
    if (opt["debug"] || opt["debug"] == false) {
        this.drawDebugInfo(opt["debug"]);
    }
};
GraphSearch.prototype.initialize = function () {
    var self = this;
    this.grid = [];
    var nodes = [];
    var $graph = this.$graph;
    $graph.empty();
    var cellWidth = ($graph.width() / this.opts.gridSize) - 2; // -2 for border
    var cellHeight = ($graph.height() / this.opts.gridSize) - 2;
    var $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight);
    var startSet = false;
    for (var x = 0; x < this.opts.gridSize; x++) {
        var $row = $("<div class='clear' />");
        var nodeRow = [];
        var gridRow = [];
        for (var y = 0; y < this.opts.gridSize; y++) {
            var id = "cell_" + x + "_" + y;
            var $cell = $cellTemplate.clone();
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
            gridRow.push($cell);
            var isWall = Math.floor(Math.random() * (1 / self.opts.wallFrequency));
            if (isWall == 0) {
                nodeRow.push(astar.GraphNodeType.WALL);
                $cell.addClass(css.wall);
            }
            else {
                var cell_weight = ($("#generateWeights").prop("checked") ? (Math.floor(Math.random() * 3)) * 2 + 1 : 1);
                nodeRow.push(cell_weight);
                $cell.addClass('weight' + cell_weight);
                if ($("#displayWeights").prop("checked")) {
                    $cell.html(cell_weight);
                }
                ;
                if (!startSet) {
                    $cell.addClass(css.start);
                    startSet = true;
                }
            }
        }
        $graph.append($row);
        this.grid.push(gridRow);
        nodes.push(nodeRow);
    }
    this.graph = new astar.Graph(nodes);
    // bind cell event, set start/wall positions
    this.$cells = $graph.find(".grid_item");
    this.$cells.click(function () { self.cellClicked($(this)); });
};
GraphSearch.prototype.cellClicked = function ($end) {
    var end = this.nodeFromElement($end);
    if ($end.hasClass(css.wall) || $end.hasClass(css.start)) {
        log("clicked on wall or start...", $end);
        return;
    }
    this.$cells.removeClass(css.finish);
    $end.addClass("finish");
    var $start = this.$cells.filter("." + css.start);
    var start = this.nodeFromElement($start);
    var sTime = new Date();
    var path = this.search(this.graph.nodes, start, end, this.opts.diagonal);
    var fTime = new Date();
    if (!path || path.length == 0) {
        $("#message").text("couldn't find a path (" + (fTime - sTime) + "ms)");
        this.animateNoPath();
    }
    else {
        $("#message").text("search took " + (fTime - sTime) + "ms.");
        if (this.opts.debug) {
            this.drawDebugInfo(this.opts.debug);
        }
        this.animatePath(path);
    }
};
GraphSearch.prototype.drawDebugInfo = function (show) {
    this.$cells.html(" ");
    var that = this;
    if (show) {
        that.$cells.each(function (i) {
            var node = that.nodeFromElement($(this));
            var debug = false;
            if (node.visited) {
                debug = "F: " + node.f + "<br />G: " + node.g + "<br />H: " + node.h;
            }
            if (debug) {
                $(this).html(debug);
            }
        });
    }
};
GraphSearch.prototype.nodeFromElement = function ($cell) {
    return this.graph.nodes[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};
GraphSearch.prototype.animateNoPath = function () {
    var $graph = this.$graph;
    var jiggle = function (lim, i) {
        if (i >= lim) {
            $graph.css("top", 0).css("left", 0);
            return;
        }
        if (!i)
            i = 0;
        i++;
        $graph.css("top", Math.random() * 6).css("left", Math.random() * 6);
        setTimeout(function () { jiggle(lim, i); }, 5);
    };
    jiggle(15);
};
GraphSearch.prototype.animatePath = function (path) {
    var grid = this.grid;
    var timeout = 1000 / grid.length;
    var elementFromNode = function (node) {
        return grid[node.pos.x][node.pos.y];
    };
    var removeClass = function (path, i) {
        if (i >= path.length)
            return;
        elementFromNode(path[i]).removeClass(css.active);
        setTimeout(function () { removeClass(path, i + 1); }, timeout * path[i].cost);
    };
    var addClass = function (path, i) {
        if (i >= path.length) {
            return removeClass(path, 0);
        }
        elementFromNode(path[i]).addClass(css.active);
        setTimeout(function () { addClass(path, i + 1); }, timeout * path[i].cost);
    };
    addClass(path, 0);
    this.$graph.find("." + css.start).removeClass(css.start);
    this.$graph.find("." + css.finish).removeClass(css.finish).addClass(css.start);
};
function calendarWeekHour(id, width, height, square) {
    var graph = d3.select(id).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "chart");
    var calData = randomData(width, height, square);
    console.log(calData);
    var row = graph.selectAll(".row")
        .data(calData)
        .enter().append("svg:g")
        .attr("class", "row");
    var col = row.selectAll(".cell")
        .data(function (d) { return d; })
        .enter().append("svg:rect")
        .attr("class", "cell")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", function (d) { return d.width; })
        .attr("height", function (d) { return d.height; })
        .on('mouseover', function () {
        d3.select(this)
            .style('fill', '#0F0');
    })
        .on('mouseout', function () {
        d3.select(this)
            .style('fill', '#FFF');
    })
        .on('click', function () {
        console.log(d3.select(this));
    })
        .style("fill", '#FFF')
        .style("stroke", '#555');
}
function randomData(graphWidth, graphHeight, square) {
    var data = new Array();
    var graphItemWidth = graphWidth / 24;
    var graphItemHeight = (square) ? graphItemWidth : graphHeight / 7;
    var startX = graphItemWidth / 2;
    var startY = graphItemHeight / 2;
    var stepX = graphItemWidth;
    var stepY = graphItemHeight;
    var xpos = startX;
    var ypos = startY;
    var newValue = 0;
    var count = 0;
    for (var index_a = 0; index_a < 7; index_a++) {
        data.push(new Array());
        for (var index_b = 0; index_b < 24; index_b++) {
            newValue = Math.round(Math.random() * (100 - 1) + 1);
            data[index_a].push({
                time: index_b,
                value: newValue,
                width: graphItemWidth,
                height: graphItemHeight,
                x: xpos,
                y: ypos,
                count: count
            });
            xpos += stepX;
            count += 1;
        }
        xpos = startX;
        ypos += stepY;
    }
    return data;
}
var reader; //GLOBAL File Reader object for demo purpose only
/**
 * Check for the various File API support.
 */
function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true;
    }
    else {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }
}
/**
 * read text input
 */
function readText(filePath) {
    var output = ""; //placeholder for text output
    if (filePath.files && filePath.files[0]) {
        reader.onload = function (e) {
            output = e.target.result;
            displayContents(output);
        }; //end onload()
        reader.readAsText(filePath.files[0]);
    } //end if html5 filelist support
    else if (ActiveXObject && filePath) {
        try {
            reader = new ActiveXObject("Scripting.FileSystemObject");
            var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
            output = file.ReadAll(); //text contents of file
            file.Close(); //close file "input stream"
            displayContents(convertToNumbers(output));
        }
        catch (e) {
            if (e.number == -2146827859) {
                alert('Unable to access local files due to browser security settings. ' +
                    'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' +
                    'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"');
            }
        }
    }
    else {
        return false;
    }
    return true;
}
function convertToNumbers(output) {
    // &colon;&rpar;
    output = output;
    return output;
}
/**
 * display content using a basic HTML replacement
 */
function displayContents(txt) {
    var lab;
    var el = document.getElementById('main');
    lines = txt.split("\n");
    el.innerHTML = "";
    for (var i = 0; lines[i]; i++) {
        if (i > 1) {
            //  lines[1] = lines[i].split('');//remove o espaco inserto automaticamente pelo browser
            n = lines[i]; //.split('');
            lines[i] = n.charAt(n.length - 1) + n.substring(0, n.length - 1); //.join();
        }
        el.innerHTML += lines[i] + "<br>";
    }
    ProcurarSaida(lines);
}
function ProcurarSaida(lines) {
    console.log(lines);
    var graph = [
        [1, 1, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 1, 1]
    ];
    graph.grid = [
        [1, 1, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 1, 1]
    ];
    var start = graph.grid[0][0];
    var end = graph.grid[1][2];
    var result = astar.search(graph, start, end);
    console.log(result);
    // result is an array containing the shortest path
   }
