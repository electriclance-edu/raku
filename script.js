document.addEventListener("keypress", function(event) {
  if (event.keyCode >= 49 && event.keyCode <= 57) {
    var key = event.keyCode - 49;
    var colors = document.getElementById("colorParent").children;
    if (key < colors.length) {
      colors[key].click();
    }
  }
});


function onload() {
  Player.initialize();
  World.initialize();
  World.generateWorld();
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
    var groundHeight = Math.ceil(this.worldHeight * 0.3);
    for (var i = 0; i < groundHeight; i++) {
      var rowIndex = this.worldData.length - i - 1;
      for (var j = 0; j < this.worldData[rowIndex].length; j++) {
        this.worldData[rowIndex][j].type = "ground";
      }
    }
    //set the resources
    var groundIndex = this.worldData.length - groundHeight;
    var groundRow = this.worldData[groundIndex];

    var resourceSpots = [];
    var resourceSpotCount = Math.ceil(this.worldWidth / 15);
    var resourceSpotWidth = Math.ceil(this.worldWidth / 5);
    for (var i = 0; i < resourceSpotCount; i++) {
      var resourceSeedIndex = randNum(groundRow.length - 1);
      //generate resources around the resource seed, slightly random
      for (var j = 0; j < resourceSpotWidth; j++) {
        if (randNumFloat(1) - 1 < Player.currentWorld.richness) {
          //columnrichness is the depth of the resource spot at one tile
          var maxColumnRichness = Math.round(Math.pow(Player.currentWorld.richness + 1,3));
          var currentColumnRichness = randNum(maxColumnRichness);
          currentColumnRichness = clamp(currentColumnRichness,1,6);
          var currentColumn = Math.round(clamp(resourceSeedIndex - resourceSpotWidth / 2 + j,0,this.worldWidth - 1));
          for (var k = 0; k < currentColumnRichness; k++) {
            this.worldData[groundIndex + k][currentColumn].resources = clamp(160 - (k * 30),20,160);
          }
        }
      }
    }
    //set alien ruins
    var ruinCount = 1; //Math.ceil(this.worldWidth / 20);
    var aboveGroundRow = this.worldData[groundIndex - 1];
    for (var i = 0; i < ruinCount; i++) {
      aboveGroundRow[randNum(2 - 1)].type = "ruin";
    }
    World.displayWorld();
  }
  static generateTable(height, width) {
    var world = document.getElementById("tiles");
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var tile = document.createElement("div");
      tile.setAttribute("draggable",false);
        tile.onclick = function() {
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
      document.getElementById("toolName").innerHTML = capitalize(tileType);
    } else {
      this.currentTileElement = undefined;
      this.currentTile = "none";
      document.getElementById("toolName").innerHTML = "";
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


var Data = {
  //colors that correspond for each tile
  tileColors:{
    ground:"rgb(50,50,60)",
    sustain:"rgb(15,150,245)",
    air:"rgb(255,255,255)",
    glue:"rgb(240,95,165)",
    gather:"rgb(230,55,55)",
    storage:"rgb(240,205,95)",
    mind:"rgb(35,230,205)",
    break:"rgb(120,120,120)",
    resource:"rgb(140,225,120)",
  },
  //used by roundifyTile, denotes which corners (topleft, topright, bottomright, bottomleft) are on the top, right, bottom, and left of a square (eg. top - topleft and topright)
  touchingCorner:[
    [true,true,false,false], //top
    [false,true,true,false], //right
    [false,false,true,true], //bottom
    [true,false,false,true], //left
  ]
}
