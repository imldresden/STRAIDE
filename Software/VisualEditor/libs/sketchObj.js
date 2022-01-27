/**
 * 
 *  This file is part of the STRAIDE Visual Editor.
 * 
 *  Foobar is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 * 
 *  Foobar is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 * 
 *  You should have received a copy of the GNU General Public License
 *  along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * @param {DOM node for this sketching object} container 
 * @param {blueprint for the sketching object} content 
 * @param {[x,y] dimension} dim 
 * @param {boolean to use color or not} color 
 * @param {callback function to be called upon color change} cb 
 */

function SketchingObj(container, content, dim, color, cb){

    this.container = container;
    this.useColor = color;
    this.callback = cb;

    this.dimension = dim;

    // ================== create sketching controls from blueprint ==============
    var c = content.innerHTML;
    c = c.replace(/xyz/g, container.id);
    container.innerHTML = c;

    var clearBtn = document.getElementById(container.id+"_clearCanvas");
    clearBtn.onclick = this.clearCanvas.bind(this);

    var addRect = document.getElementById(container.id + "_addRect");
    addRect.onclick = this.addRectangle.bind(this);
    
    var addTri = document.getElementById(container.id + "_addTri");
    addTri.onclick = this.addTriangle.bind(this);

    var addCirc = document.getElementById(container.id + "_addCirc");
    addCirc.onclick = this.addCircle.bind(this);

    var freeDraw = document.getElementById(container.id + "_toggleBrush");
    freeDraw.onclick = this.toggleFreeDraw.bind(this);

    var brushWidth = document.getElementById(container.id + "_brushWidth");
    brushWidth.onchange = function(){this.changeDrawWidth(brushWidth.value);}.bind(this);

    this.baseColorInput = document.getElementById(container.id + "_baseColor");
    this.baseColorInput.oninput = this.changeBaseColor.bind(this);

    this.endColorInput = document.getElementById(container.id + "_endColor");
    this.endColorInput.oninput = this.changeEndColor.bind(this);

    this.gradientToggle = document.getElementById(container.id + "_toggleGradient");
    this.gradientToggle.onclick = this.toggleGradient.bind(this);

    this.linearGradientRadio = document.getElementById(container.id + "_linearGradient");
    this.linearGradientRadio.onchange = function(){this.updateFill(this.canvas.getActiveObject());}.bind(this);

    var radialGradientRadio = document.getElementById(container.id + "_radialGradient");
    radialGradientRadio.onchange = function(){this.updateFill(this.canvas.getActiveObject());}.bind(this);

    this.gradientAngleInput = document.getElementById(container.id + "_gradientAngle");
    this.gradientAngleInput.onchange = function(){this.updateFill(this.canvas.getActiveObject());}.bind(this);

    this.resImg =  document.getElementById(container.id + "_resImg");
    this.resImg.height = 64 * this.dimension[1] / this.dimension[0];
         
    this.canvas = new fabric.Canvas(container.id+"_canvas", {
        imageSmoothinEnabled: false,
        selection: false,
        selectionLineWidth: 0.001,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
        perPixelTargetFind: true,
    });
    this.canvas.setDimensions({
        width: 400,
        height: 400 * this.dimension[1] / this.dimension[0]
    });
    this.canvas.calcOffset();
    this.clearCanvas()

    fabric.Object.NUM_FRACTION_DIGITS = 10;
    this.canvas.freeDrawingBrush.width = 400/this.dimension[0];
    

    document.addEventListener("keydown",e => {if(e.code === "Delete"){deleteObject(null,this.canvas.getActiveObject())}});

    this.canvas.on({
        'selection:created': this.updateInput.bind(this),
        'selection:updated': this.updateInput.bind(this),
        "object:modified": this.renderToImage.bind(this),
        "object:added": this.renderToImage.bind(this),
        "object:removed": this.renderToImage.bind(this),
        "path:created": this.renderToImage.bind(this)
    });

    this.delayedTrigger = null;
}

SketchingObj.prototype.clearCanvas = function(){
    this.canvas.clear();
    if (this.dimension[0] == 8 && this.dimension[1] == 8 && (location.hostname === "localhost" || location.hostname === "127.0.0.1"))
        this.canvas.setOverlayImage("./img/grid.png", this.canvas.renderAll.bind(this.canvas));
    this.renderToImage();
}

// ====================== Color functions (two-way) ==========================

SketchingObj.prototype.toggleGradient = function(){
    document.getElementById(this.container.id + "_gradientCollapse").style = this.gradientToggle.checked ? "" : "visibility: hidden";
    var el = this.canvas.getActiveObject();
    this.updateFill(el);
}

SketchingObj.prototype.updateFill = function(el){
    if(el){
        switch(el.get("type")){
            case "path":
                el.set("stroke",this.baseColorInput.value);
                break;
            case "circle":
            case "rect":
            case "triangle":
                if(this.gradientToggle.checked){
                    var newCoords;
                    var angle = this.gradientAngleInput.value;
                    if(this.linearGradientRadio.checked){
                        newCoords = {x1: 0, y1: el.height/2, x2: el.width, y2: el.height/2};
                        var a = rotate(el.width/2,el.height/2,0,el.height/2,angle);
                        var b = rotate(el.width/2,el.height/2,el.width,el.height/2,angle);
                        newCoords = {x1: a[0],y1: a[1], x2: b[0], y2: b[1]};
                    } else {
                        newCoords = {x1: el.width/2, y1: el.height/2, r1: 0, x2: el.width/2, y2: el.height/2, r2: el.width}
                    }
    
                    
                    var grad = new fabric.Gradient({
                        type: this.linearGradientRadio.checked ? "linear" : "radial",
                        coords: newCoords,
                        colorStops: [
                            {
                                offset:0,
                                color:this.baseColorInput.value
                            },{
                                offset:1,
                                color:this.endColorInput.value
                            }
                        ]
                    });
                    el.set("fill",grad);
                } else {
                    el.set("fill",this.baseColorInput.value);
                }
                break;
        }
    
        this.canvas.renderAll();
    
        clearTimeout(this.delayedTrigger);
        var that = this;
        this.delayedTrigger = setTimeout(function(){that.canvas.fire("object:modified");},200);
    }
}


SketchingObj.prototype.updateInput = function(){
    var el = this.canvas.getActiveObject();
    var baseCol;
    var endCol = null;
    if(el){
        switch(el.get("type")){
            case "circle":
            case "rect":
            case "triangle":
                var fill = el.get("fill");
                if(fill.colorStops){
                    baseCol = new fabric.Color(fill.colorStops[0].color);
                    endCol = new fabric.Color(fill.colorStops[1].color);
                    this.gradientToggle.checked = true;
                    document.getElementById(this.container.id + "_gradientCollapse").style = "";
                    if(fill.type == "radial"){
                        document.getElementById(this.container.id + "_radialGradient").checked = true;
                    } else {
                        this.linearGradientRadio.checked = true;
                    }
                } else {
                    baseCol = new fabric.Color(fill);
                    this.gradientToggle.checked = false;
                    document.getElementById(this.container.id + "_gradientCollapse").style = "visibility: hidden";
                }
                this.gradientToggle.disabled = false;
                break;
            case "path":
                baseCol = new fabric.Color(el.get("stroke"));
                this.gradientToggle.disabled = true;
                document.getElementById(this.container.id + "_gradientCollapse").style = "visibility: hidden";
                break;
        }
        this.baseColorInput.value = "#" + baseCol.toHex();
        if(endCol){this.endColorInput.value = "#" + endCol.toHex();}
        this.canvas.freeDrawingBrush.color = baseCol.toRgb();


    }
}

SketchingObj.prototype.changeBaseColor = function(){
    var col = new fabric.Color(this.baseColorInput.value);
    if(!this.useColor){
        col = col.toGrayscale();
        this.baseColorInput.value = "#" + col.toHex();
    }

    this.canvas.freeDrawingBrush.color = col.toRgb();
    var el = this.canvas.getActiveObject();
    this.updateFill(el);
}

SketchingObj.prototype.changeEndColor = function(){
    var col = new fabric.Color(this.endColorInput.value);
    if(!this.useColor){
        col = col.toGrayscale();
        this.endColorInput.value = "#" + col.toHex();
    }

    var el = this.canvas.getActiveObject();
    this.updateFill(el);
}

// ========================== brush functionality ====================

SketchingObj.prototype.toggleFreeDraw = function(){
    this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
    document.getElementById(this.container.id + "_brushCollapse").style = this.canvas.isDrawingMode ? "" : "visibility: hidden";
    this.canvas.discardActiveObject().renderAll();
}

SketchingObj.prototype.changeDrawColor = function(col){
    this.canvas.freeDrawingBrush.color = col;
}

SketchingObj.prototype.changeDrawWidth = function(width){
    this.canvas.freeDrawingBrush.width = parseInt(width);
}


// =========================== add shapes =============================

SketchingObj.prototype.addRectangle = function(){
    var rect = new fabric.Rect({
        left: 400/this.dimension[0],
        top: 400/this.dimension[0],
        width: 400/this.dimension[0],
        height: 400/this.dimension[0],
        fill: this.baseColorInput.value,
        //objectCaching: false
    });
    
    this.canvas.add(rect);
    this.canvas.setActiveObject(rect).renderAll();
}

SketchingObj.prototype.addTriangle = function(){
    var tri = new fabric.Triangle({
        top: 400/this.dimension[0],
        left: 400/this.dimension[0],
        width: 400/this.dimension[0]*2,
        height: 400/this.dimension[0]*2,
        fill: this.baseColorInput.value,
        //objectCaching: false
    });
    this.canvas.add(tri);
    this.canvas.setActiveObject(tri).renderAll();
}

SketchingObj.prototype.addCircle = function(){
    var circ = new fabric.Circle({
        top: 400/this.dimension[0],
        left: 400/this.dimension[0],
        radius: 400/this.dimension[0],
        fill: this.baseColorInput.value,
        //objectCaching: false
    });
    this.canvas.add(circ);
    this.canvas.setActiveObject(circ).renderAll();
}

// ===================== create preview of content and send it to STRAIDE =====================

SketchingObj.prototype.renderToImage = function(){
    var selected = this.canvas.getActiveObject();
    this.canvas.discardActiveObject().renderAll();

    this.resImg.src = this.canvas.toDataURL({format:"png", multiplier: this.dimension[0]/400});

    var colors = new Array();
    var cnvs = this.canvas.getElement()
    
    for(var y = 0; y < this.dimension[1]; y++){
        for(var x = 0; x < this.dimension[0]; x++){
            colors[y*8+x] = this.canvas.getElement().getContext("2d").getImageData((x + 0.5) * cnvs.width / this.dimension[0], (y + 0.5) * cnvs.height / this.dimension[1], 1, 1).data;
        }
    }
    this.callback(colors);

    if(selected)
        this.canvas.setActiveObject(selected).renderAll();
};

// ==================== export to file and import ===================================

SketchingObj.prototype.exportContent = function(){
    var res = new Array();
    res[0] = this.resImg.src;
    this.canvas.setOverlayImage(null, this.canvas.renderAll.bind(this.canvas));
    res[1] = JSON.stringify(this.canvas);
    this.canvas.setOverlayImage('./img/grid.png', this.canvas.renderAll.bind(this.canvas))
    return res;
}

SketchingObj.prototype.importContent = function(content){
    this.removeEventListeners();
    this.canvas.loadFromJSON(content, function(){
        this.addEventListeners();
        this.renderToImage();
    }.bind(this));

}

// ===================== add a rectangle if direct input on STRAIDE is used ===========

SketchingObj.prototype.oninput = function(x,y,val){
    this.removeEventListeners();
    const col = "rgb("+val/19.6+","+val/19.6+","+val/19.6+")";
    
    var found = false;
    this.canvas.getObjects().forEach(function(el){
        if(!found && Math.abs(el.left - x * 50) < 5 && Math.abs(el.top - 350 + y * 50) < 5 && el.width == 50 && el.height == 50){
            el.set("fill", col);
            found = true;
        }
    }.bind(this));


    if(!found){
        var rect = new fabric.Rect({
            left: x*50,
            top: 350-y*50,
            width: 50,
            height: 50,
            fill: col,
        });
        this.canvas.add(rect);
    }
    this.canvas.renderAll();
    this.addEventListeners();
}

// ============== Event Listeners =========================

SketchingObj.prototype.removeEventListeners = function(){
    this.canvas.__eventListeners["object:added"] = [];
    this.canvas.__eventListeners["object:modified"] = [];
    this.canvas.__eventListeners["path:created"] = [];
}

SketchingObj.prototype.addEventListeners = function(){
    this.canvas.on({
        "object:added": this.renderToImage.bind(this),
        "object:modified": this.renderToImage.bind(this),
        "path:created": this.renderToImage.bind(this)
    });
}



// ============ Custom Fabric.JS controls for layer control ========

var deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
var upIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='arrow-circle-up' class='svg-inline--fa fa-arrow-circle-up fa-w-16' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Ccircle cx='256' cy='256' r='200' fill='white'/%3E%3Cpath fill='currentColor' d='M8 256C8 119 119 8 256 8s248 111 248 248-111 248-248 248S8 393 8 256zm143.6 28.9l72.4-75.5V392c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V209.4l72.4 75.5c9.3 9.7 24.8 9.9 34.3.4l10.9-11c9.4-9.4 9.4-24.6 0-33.9L273 107.7c-9.4-9.4-24.6-9.4-33.9 0L106.3 240.4c-9.4 9.4-9.4 24.6 0 33.9l10.9 11c9.6 9.5 25.1 9.3 34.4-.4z'%3E%3C/path%3E%3C/svg%3E";
var downIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='arrow-circle-down' class='svg-inline--fa fa-arrow-circle-down fa-w-16' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Ccircle cx='256' cy='256' r='200' fill='white'/%3E%3Cpath fill='currentColor' d='M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-143.6-28.9L288 302.6V120c0-13.3-10.7-24-24-24h-16c-13.3 0-24 10.7-24 24v182.6l-72.4-75.5c-9.3-9.7-24.8-9.9-34.3-.4l-10.9 11c-9.4 9.4-9.4 24.6 0 33.9L239 404.3c9.4 9.4 24.6 9.4 33.9 0l132.7-132.7c9.4-9.4 9.4-24.6 0-33.9l-10.9-11c-9.5-9.5-25-9.3-34.3.4z'%3E%3C/path%3E%3C/svg%3E";

var delImg = document.createElement('img');
delImg.src = deleteIcon;
var upImg = document.createElement("img");
upImg.src = upIcon;
var downImg = document.createElement("img");
downImg.src = downIcon;

function renderIcon(ctx, left, top, styleOverride, fabricObject) {
    var size = this.cornerSize;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
    switch(this.mouseUpHandler){
        case deleteObject: ctx.drawImage(delImg, -size/2, -size/2, size, size); break;
        case objectForward: ctx.drawImage(upImg, -size/2, -size/2, size, size); break;
        case objectBackward: ctx.drawImage(downImg, -size/2, -size/2, size, size); break;
    };
    ctx.restore();
}

fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: 25,
    cursorStyle: 'pointer',
    mouseUpHandler: deleteObject,
    render: renderIcon,
    cornerSize: 24
});

fabric.Object.prototype.controls.upControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: 50,
    cursorStyle: 'pointer',
    mouseUpHandler: objectForward,
    render: renderIcon,
    cornerSize: 24
});

fabric.Object.prototype.controls.downControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: 75,
    cursorStyle: 'pointer',
    mouseUpHandler: objectBackward,
    render: renderIcon,
    cornerSize: 24
});

function deleteObject(eventData, target) {
    if(target){
        var canvas = target.canvas;
        canvas.remove(target);
        canvas.requestRenderAll();
    }
}

function objectForward(eventData,target){
    target.bringForward();
}

function objectBackward(eventData,target){
    target.sendBackwards();
}

function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
}