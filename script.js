document.addEventListener("keypress", function(event) {
  if (event.keyCode >= 49 && event.keyCode <= 57) {
    var key = event.keyCode - 49;
    var colors = document.getElementById("colorParent").children;
    if (key < colors.length) {
      colors[key].click();
    }
  }
});

var mouseDown;

function onload() {
  Player.initialize();
  World.initialize();
  World.generateWorld();
  generateColorSwatches();
  document.body.onmousedown = function(mouse) {
    if (mouse.button == 0) {
      mouseDown = true;
    }
  }
  document.body.onmouseup = function(mouse) {
    if (mouse.button == 0) {
      mouseDown = false;
    }
  }
}
class World {
  static initialize() {
    this.worldData = [];
    this.roundification = {
      updateRadius(element,radii) {
        if (radii[0] != -1) {
          element.style.borderTopLeftRadius = radii[0] + "px";
        }
        if (radii[1] != -1) {
          element.style.borderTopRightRadius = radii[1] + "px";
        }
        if (radii[2] != -1) {
          element.style.borderBottomRightRadius = radii[2] + "px";
        }
        if (radii[3] != -1) {
          element.style.borderBottomLeftRadius = radii[3] + "px";
        }
      },
      removeContactingCorners(side,radius) {
        if (Data.touchingCorner[side][0] == true) {
          radius[0] = 0;
        }
        if (Data.touchingCorner[side][1] == true) {
          radius[1] = 0;
        }
        if (Data.touchingCorner[side][2] == true) {
          radius[2] = 0;
        }
        if (Data.touchingCorner[side][3] == true) {
          radius[3] = 0;
        }
        return radius;
      },
      calculateRadiiByAdjacents(radii,coords,type) {
        var adjacentTiles = [
          [coords.x, coords.y - 1],
          [coords.x + 1, coords.y],
          [coords.x, coords.y + 1],
          [coords.x - 1, coords.y],
        ]
        for (var i = 0; i < 4; i++) {
          var tile = World.getTile({x:adjacentTiles[i][0],y:adjacentTiles[i][1]});
          var adjacentTileIndex = World.coordinateToIndex({x:adjacentTiles[i][0],y:adjacentTiles[i][1]});
          var adjacentTile = document.getElementById("tiles").children[adjacentTileIndex];

          if (tile.type == type && tile != false || tile.type == "glue") {
            radii = World.roundification.removeContactingCorners(i,radii);
          }
          if (type == "glue" && tile.type != "air") {
            radii = World.roundification.removeContactingCorners(i,radii);
          }
        }
        return radii;
      }
    }
  }
  static generateWorld() {
    var blockSize = document.body.offsetHeight / 100 * 5;
    this.worldHeight = Math.ceil(document.body.offsetHeight / blockSize);
    this.worldWidth = Math.ceil(document.body.offsetWidth / blockSize);
    console.log(this.worldWidth);
    World.generateTable(this.worldHeight, this.worldWidth);

    var centeringOffset = (document.body.offsetWidth - (this.worldWidth * blockSize)) / 2 + "px";
    document.getElementById("tiles").style.left = centeringOffset;

    //set the data
    for (var i = 0; i < this.worldHeight; i++) {
      var row = [];
      for (var j = 0; j < this.worldWidth; j++) {
        row.push({
          type:"air"
        });
      }
      this.worldData.push(row);
    }

    //set the ground
    var groundHeight = Math.ceil(this.worldHeight * 0.2);
    for (var i = 0; i < groundHeight; i++) {
      var rowIndex = this.worldData.length - i - 1;
      for (var j = 0; j < this.worldData[rowIndex].length; j++) {
        this.worldData[rowIndex][j].type = "ground";
      }
    }
    World.displayWorld();
  }
  static generateTable(height, width) {
    var world = document.getElementById("tiles");
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var tile = document.createElement("div");
        tile.addEventListener('dragstart', (e) => {
          e.preventDefault()
        })

        tile.addEventListener('drop', (e) => {
          e.preventDefault()
        })
        tile.setAttribute("draggable",false);
        tile.onmousedown = function() {
          var element = this;
          var indexOfChild = 0;

          //https://stackoverflow.com/questions/5913927/get-child-node-index
          while((element = element.previousSibling) != null)
            indexOfChild++;

          World.editTile(indexOfChild,Player.currentTile);
        };
        tile.onmouseover = function() {
          if (!mouseDown) {
            return;
          }

          var element = this;
          var indexOfChild = 0;

          //https://stackoverflow.com/questions/5913927/get-child-node-index
          while((element = element.previousSibling) != null)
            indexOfChild++;

          World.editTile(indexOfChild,Player.currentTile);
        };
        world.appendChild(tile);
      }
      var br = document.createElement("br");
      world.appendChild(br);
    }
  }
  static displayWorld() {
    var tiles = document.getElementById("tiles").children;
    for (var i = 0; i < this.worldHeight; i++) {
      for (var j = 0; j < this.worldWidth; j++) {
        var tileElement = tiles[i * (this.worldWidth + 1) + j];
        tileElement.style.backgroundColor = Data.tileColors[this.worldData[i][j].type];
        tileElement.style.filter = "saturate(" + (this.worldData[i][j].resources / 15) + ")";
      }
    }
  }
  static editTile(index,type) {
    index += 2;
    if (type == undefined || type == "none") {
      return true;
    }

    index--; index--;
    var coords = World.indexToCoordinate(index);

    var tile = World.getTile(coords);

    if (tile != false) {
      this.worldData[coords.y][coords.x - 1] = {type:type};
      var tileElement = document.getElementById("tiles").children[coords.y * (this.worldWidth + 1) + coords.x - 1];
      tile.style = " ";
      tileElement.style.backgroundColor = Data.tileColors[type];
      World.roundifyTile(index,type)
    }
  }
  //roundifyTile(): update the border-radious of a single element depending on the surrounding tiles
  static roundifyTile(index,type,skipAdjacents = true) {

    var centerBoxRadii = [20,20,20,20];
    var coords = World.indexToCoordinate(index);

    //first, set the radii of the current tile
    if (type != "air") {
      centerBoxRadii = World.roundification.calculateRadiiByAdjacents(centerBoxRadii,coords,type);
    } else {
      centerBoxRadii = [0,0,0,0];
    }
    World.roundification.updateRadius(document.getElementById("tiles").children[index - 1],centerBoxRadii);
    //then, roundify the adjacent tiles
    if (skipAdjacents) {
      var adjacentTiles = [
        {x:coords.x, y:coords.y - 1},
        {x:coords.x + 1,y:coords.y},
        {x:coords.x,y:coords.y + 1},
        {x:coords.x - 1,y:coords.y},
      ]
      for (var i = 0; i < 4; i++) {
        var adjacentTileType = World.getTile(adjacentTiles[i]).type;

        var adjacentTileRadii = World.roundification.calculateRadiiByAdjacents([20,20,20,20],adjacentTiles[i],adjacentTileType);
        var adjacentTileIndex = World.coordinateToIndex(adjacentTiles[i]);
        var adjacentTile = document.getElementById("tiles").children[adjacentTileIndex];

        var adjacentTileValid = World.getTile(adjacentTiles[i]);

        if (adjacentTileType != "air" && adjacentTileValid != false) {
          World.roundification.updateRadius(adjacentTile,adjacentTileRadii);
        }
      }
    }
  }
  //getTile(): does the same as the line World.worldData[x][y] but safer since it'll return false if outside of bounds
  static validBuildability(index, type) {

  }
  static indexToCoordinate(index) {
    var x = index % (this.worldWidth + 1);
    var y = Math.floor(index / (this.worldWidth + 1));
    return {x:x,y:y}
  }
  static coordinateToIndex(coords) {
    return coords.y * (this.worldWidth + 1) + coords.x - 1;
  }
  static getTile(coords) {
    var row = World.worldData[coords.y];
    if (row == undefined) {
      return false;
    }
    var tile = row[coords.x - 1];
    if (tile == undefined) {
      return false;
    } else {
      return tile;
    }
  }
}
class Player {
  static initialize() {
    this.currentWorld = {
      richness:0.7, //richness of 0.8 means 80% of all resource tiles will actually work
    }
  }
  static selectBuildTile(element,tileType) {
    if (this.currentTileElement != undefined) {
      var oldClass = this.currentTileElement.className;
      this.currentTileElement.className = oldClass.substring(0,oldClass.length - 14);
    }
    if (this.currentTileElement != element) {
      this.currentTile = tileType;

      element.className += " selectedColor";
      this.currentTileElement = element;
    } else {
      this.currentTileElement = undefined;
      this.currentTile = "none";
    }
  }
}
function clamp(number,min,max) {
  if (number <= max && number >= min) {
    return number;
  } else if (number < min) {
    return min;
  } else if (number > max) {
    return max;
  }
}
function randNum(max) {
  return Math.floor(Math.random() * max) + 1;
}
function randNumFloat(max) {
  return Math.random() * max + 1;
}
function capitalize(string) {
  return string[0].toUpperCase() + string.substring(1,string.length);
}

function generateColorSwatches() {
  var keys = Object.keys(Data.tileColors);

  keys.forEach((key) => {
    var elem = generateColorElem(key,Data.tileColors[key]);

    if (key == "ground") {
      elem.classList.add("borderWhite");
    }
    document.getElementById("colorParent").appendChild(elem);
  });

}
function generateColorElem(name,color) {
  var elem = document.createElement("div");
  elem.style.backgroundColor = color;
  elem.id = name;
  elem.onclick = function() {
    Player.selectBuildTile(this,this.id);
  };

  return elem;
}

var Data = {
  //colors that correspond for each tile
  atileColors:{
    air:"rgb(255,255,255)",
    ground:"rgb(50,50,60)",
    cyan:"rgb(35,230,205)",
    blue:"rgb(15,150,245)",
    violet:"#783EFF",
    red:"rgb(230,55,55)",
    yellow:"rgb(240,205,95)",
    grey:"rgb(120,120,120)",
    glue:"rgb(240,95,165)",
  },
  tileColors:{
    air:"rgb(255,255,255)",
    ground:"#2d3142",
    green:"rgb(35,230,205)",
    dark_green:"#0B7A75",
    blue:"#3772FF",
    glue:"#FFEAD9",
    orange:"#FCA311",
    neon_orange:"#FB4D3D",
    dark_red:"#D90368",
    maroon:"#932323",
    purple:"#BA85F2",
    // red:"#F7567C",
  },
  //used by roundifyTile, denotes which corners (topleft, topright, bottomright, bottomleft) are on the top, right, bottom, and left of a square (eg. top - topleft and topright)
  touchingCorner:[
    [true,true,false,false], //top
    [false,true,true,false], //right
    [false,false,true,true], //bottom
    [true,false,false,true], //left
  ]
}
