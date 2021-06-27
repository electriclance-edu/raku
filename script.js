function onload() {
  World.initialize();
  World.generateWorld();
}
class World {
  static initialize() {
    this.worldData = [];
  }
  static generateWorld() {
    var blockSize = document.body.offsetHeight / 100 * 7;
    this.worldHeight = Math.ceil(document.body.offsetHeight / blockSize);
    this.worldWidth = Math.ceil(document.body.offsetWidth / blockSize);
    World.generateTable(this.worldHeight, this.worldWidth);

    var centeringOffset = (document.body.offsetWidth - (this.worldWidth * blockSize)) / 2 + "px";
    document.getElementById("tiles").style.left = centeringOffset;

    var groundHeight = Math.ceil(this.worldHeight * 0.3);
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
      var row = [];
      this.worldData.push(row);
      for (var j = 0; j < width; j++) {
        var tile = document.createElement("div");
        tile.onclick = function() {
          var element = this;
          var i = 0;
          while( (element = element.previousSibling) != null )
          i++;
          World.editTile(i,Player.currentTile);
        };

        row.push({
          type:"air"
        });
        world.appendChild(tile);
      }
      var br = document.createElement("br");
      world.appendChild(br);
    }
  }
  static editTile(index,type) {
    if (type == undefined) {
      return true;
    }

    var coords = World.indexToCoordinate(index);

    this.worldData[coords.y][coords.x].type = type;
    document.getElementById("tiles").children[coords.y * (this.worldWidth + 1) + coords.x - 1].style.backgroundColor = Data.colors[type];
    World.roundifyTile(index)
  }
  static indexToCoordinate(index) {
    var x = index % (this.worldWidth + 1);
    var y = Math.floor(index / (this.worldWidth + 1));
    return {x:x,y:y}
  }
  static coordinateToIndex(coords) {
    return coords.y * (this.worldWidth + 1) + coords.x - 1;
  }
  //update the border-radious of a single element depending on the surrounding tiles
  static roundifyTile(index) {
    var updateRadius = function(element,radii) {
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
    }
    var removeContactingCorners = function(side,radius) {
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
    }

    var centerBoxRadii = [20,20,20,20];

    var coords = World.indexToCoordinate(index);
    var adjacentTiles = [
      [coords.x, coords.y - 1],
      [coords.x + 1, coords.y],
      [coords.x, coords.y + 1],
      [coords.x - 1, coords.y],
    ]
    //first, determine the border-radius of the middle tile
    for (var i = 0; i < 4; i++) {
      var tile = World.getTile(adjacentTiles[i]);
      if (tile.type != "air" && tile.type != "ground") {
        centerBoxRadii = removeContactingCorners(i,centerBoxRadii);
        var indexOfAdjacent = World.coordinateToIndex({x:adjacentTiles[i][0],y:adjacentTiles[i][1]});
        updateRadius(document.getElementById("tiles").children[indexOfAdjacent],removeContactingCorners(Data.oppositeDirection[i],[-1,-1,-1,-1]));
      }
    }

    updateRadius(document.getElementById("tiles").children[index - 1],centerBoxRadii);
  }
  //basically a call to World.worldData, but safer since it'll return false if outside of bounds
  static getTile(coords) {
    var row = World.worldData[coords[1]];
    if (row == undefined) {
      return false;
    }
    var tile = row[coords[0]];
    if (tile == undefined) {
      return false;
    } else {
      return tile;
    }
  }
  static displayWorld() {
    var tiles = document.getElementById("tiles").children;
    for (var i = 0; i < this.worldHeight; i++) {
      for (var j = 0; j < this.worldWidth; j++) {
        tiles[i * (this.worldWidth + 1) + j].style.backgroundColor = Data.colors[this.worldData[i][j].type];
      }
    }
  }
}
class Player {
  static initialize() {
    this.currentTile = "water";
  }
  static selectBuildTile(element,color) {
    if (this.currentTileElement != undefined) {
      var oldClass = this.currentTileElement.className;
      this.currentTileElement.className = oldClass.substring(0,oldClass.length - 15);
    }
    if (this.currentTileElement != element) {
      this.currentTile = color;

      element.className += " selectedCircle";
      this.currentTileElement = element;
    } else {
      this.currentTileElement = undefined;
      this.currentTile = "none";
    }
  }
}
function randNum(max) {
  return Math.floor(Math.random() * max) + 1;
}



var Data = {
  //colors that correspond for each tile
  colors:{
    ground:"rgb(50,50,60)",
    water:"rgb(15,150,245)",
    air:"rgb(255,255,255)",
    red:"rgb(230,55,55)",
    yellow:"rgb(240,205,95)",
    cyan:"rgb(35,230,205)",
  },
  //used by roundifyTile, denotes which corners (topleft, topright, bottomright, bottomleft) are on the top, right, bottom, and left of a square (eg. top - topleft and topright)
  touchingCorner:[
    [true,true,false,false], //top
    [false,true,true,false], //right
    [false,false,true,true], //bottom
    [true,false,false,true], //left
  ],
  //used by roundifyTile, denotes the opposite direction of a tile (eg top [0] = bottom [2])
  oppositeDirection:[2,3,0,1]
}
