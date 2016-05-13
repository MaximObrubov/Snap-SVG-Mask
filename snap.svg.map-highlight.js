var Map = function (params) {
    var self = this,
        parent = document.querySelector(params.container);
    self.backlightButton = document.querySelectorAll(params.groupHighlightBtn);
    self.fullWidth = parent.offsetWidth;
    // animation params
    self.HOVER_COLOR = params.hoverColor || '#fff';
    self.SHADOW_COLOR = params.shadowColor || '#000';
    self.SHADOW_OPACITY = params.shadowOpacity || 0.6;
    self.HOVER_OPACITY = params.hoverOpacity || 0.2;
    self.HIDE_TIME = params.hideTime || 300;
    self.SHOW_TIME = params.showTime || 300;
    // new svg element
    self.canvas = Snap('#map');
    // render image params
    self.svgFile = params.svg;
    self.renderImg = {};
    self.objClickCallback = params.onObjectClick;
    // инициализируем модуль на прогрузку основного изображения карты
    var i = new Image();
    i.onload = function () {
        var realWidth = i.width,
            realHeight = i.height;
        self.scaleRate = self.fullWidth/realWidth;
        self.bgHeight = realHeight * self.scaleRate;
        parent.setAttribute('style', 'height:' + self.bgHeight + 'px;');
        // start module activity
        self.init();
    };
    i.src = params.image.day;
    if (params.image.day && params.image.night) {
        self.isDaytimeActive = true;
        self.renderImg.path = params.image.day;
        self.renderImg.nightpath = params.image.night;
    } else {
        self.isDaytimeActive = false;
        self.renderImg.path = params.image;
    }
    i.src = self.renderImg.path;
    if (params.icons) {
        self.icons = params.icons;
    }
    self.groupLayers = {};
};


Map.prototype.init = function () {
    var self = this;
    self.makeDefs();
    self.setBg();
    self.catchPaths();
    self.onGroupSelect();
    self.setIcons();
};


Map.prototype.makeDefs = function () {
    var self = this;
    self.mapPattern = self.canvas.image(self.renderImg.path, 0, 0, self.fullWidth, self.bgHeight).pattern(0, 0, self.fullWidth, self.bgHeight);
    self.activePattern = self.mapPattern;
    self.glowFilter = self.canvas.filter(Snap.filter.shadow(0, 0, 3, self.HOVER_COLOR));
    if (self.renderImg.nightpath) {
        self.mapNightPattern = self.canvas.image(self.renderImg.nightpath, 0, 0, self.fullWidth, self.bgHeight).pattern(0, 0, self.fullWidth, self.bgHeight);
    }
    // создаем основной слой на котором будут располагаться элементы
    self.mainLayer = self.canvas.g();
};


Map.prototype.setBg = function (path) {
    var self = this;
    self.background = self.mainLayer.rect(0, 0, self.fullWidth, self.bgHeight);
    self.background.attr({
        fill: self.mapPattern
    });
    if (self.renderImg.nightpath) {
        self.nightBackground = self.mainLayer.rect(0, 0, self.fullWidth, self.bgHeight);
        self.nightBackground.attr({
            fill: self.mapNightPattern
        });
        self.nightBackground.insertBefore(self.background);
    }
};
/**---------------------------------------------------------------------------------------------
                                      PROCEDURES
----------------------------------------------------------------------------------------------*/
Map.prototype.hideSVG = function (svgElement, isRemove) {
    var self = this;
    svgElement.animate({
        opacity: 0
    }, self.HIDE_TIME);
    setTimeout( function () {
        if (isRemove) {
            svgElement.remove();
        } else {
            svgElement.insertBefore(self.background);
        }
    }, self.HIDE_TIME);
};


Map.prototype.showSVG = function (layer) {
    var self = this;
    layer
        .insertAfter(self.mainLayer)
        .animate({
            opacity: 1
        }, self.SHOW_TIME);
};

/**---------------------------------------------------------------------------------------------
                                        SHADOW
----------------------------------------------------------------------------------------------*/
Map.prototype.setShadow = function () {
    var self = this;
    shadowLayer = self.canvas.g().insertBefore(self.background);
    shadowLayer.attr({opacity:0, name: 'shadow'});
    shadow = shadowLayer.rect(0, 0, self.fullWidth, self.bgHeight);
    shadow
        .attr({
            opacity: self.SHADOW_OPACITY,
            fill: self.SHADOW_COLOR,
        });
    return shadowLayer;
};


Map.prototype.toShadow = function (target) {
    var self = this,
        element = target.clone();
    element.attr({fill: self.activePattern, opacity: 1});;
    self.shadowLayer = self.setShadow();
    self.shadowLayer.append(element);
    self.showSVG(self.shadowLayer);
};
 

Map.prototype.hideShadow = function (shadowLayer) {
    var self = this;
    if (self.shadowLayer) {
        self.hideSVG(self.shadowLayer, true)
    }
};


/**------------------------------------------------------------------------------------------*/
Map.prototype.catchPaths = function () {
    var self = this;
    Snap.load(self.svgFile, svgOnloaded);
    
    function svgOnloaded(f) {
        var allObjects = f.selectAll('#hover g'),
            allPathsLength = allObjects.length; 
        for (var i=0; i<allPathsLength; i++) {
            self.CreateNewObject(allObjects[i]);
        }
    }
};


Map.prototype.CreateNewObject = function (obj) {
    var self = this,
        objPath = obj.select('path'),
        type = objPath.attr('type');
    self.scalePath(objPath); 
    objPath.attr({
        filter: self.glowFilter,
        style: 'cursor:pointer;',
        fill: self.HOVER_COLOR,
        opacity: 0
    });        
    if (type) {
        obj.click( function (e) {
            self.toShadow(objPath);
            self.objClickCallback(this.select('path'));
        });
    }
    self.onPathHover(objPath);
    if ( !self.groupLayers[type] && type){
        self.groupLayers[type] = self.mainLayer.g().attr({name:type});
    }
    if (type) {
        self.groupLayers[type].append(obj);
    } else {
        self.mainLayer.append(obj);
    }
};


Map.prototype.onPathHover = function (element) {
    var self = this;
    element
        .hover(
            function() {
                this.animate({
                    opacity: self.HOVER_OPACITY
                }, self.SHOW_TIME);
            },
            function() {
                this.animate({
                    opacity: 0
                }, self.HIDE_TIME);
            }
        );
};


Map.prototype.scalePath = function (path) {
    var self = this,
        points = path.node.pathSegList,
        pointsCount = points.numberOfItems - 1;
    
    for (var i=0; i<pointsCount; i++) {
        points.getItem(i).x *= self.scaleRate;
        points.getItem(i).y *= self.scaleRate;
    }  
};


/**----------------------------------------------------------------------------------
                                        Icons
------------------------------------------------------------------------------------*/
Map.prototype.setIcons = function () {
    var self = this;
    self.iconsLayer = self.mainLayer.g().insertBefore(self.background).attr({opacity: 0});
    if ( self.isDaytimeActive ) {
        self.setDaytimeIcons();
    }
    if (self.icons) {
        self.setCustomIcons(self.icons, false);
    }
    self.showSVG(self.iconsLayer);
};


Map.prototype.setCustomIcons = function (icons, onIconClick) {
    var self = this,
        iconPath = icons.source,
        iconCount = icons.coords.length,
        x ,y, w, h;
    var iconImage = new Image();
    iconImage.onload = function () {
        w = iconImage.width,
        h = iconImage.height;
        for (var i=0; i < iconCount; i++){
            x = icons.coords[i][0] * self.scaleRate;
            y = icons.coords[i][1] * self.scaleRate;
            icon = self.iconsLayer.image(iconPath, x, y, w, h).attr({style: 'cursor:pointer;'});
            if (onIconClick) {
                // принудительная привязка к текущему контексту
                icon.click(onIconClick.bind(self));
            }
        }
    };
    iconImage.src = iconPath;
};


Map.prototype.switchToDay = function () {
    var self = this;
    self.activePattern = self.mapPattern;
    self.background.animate({
        opacity: 1,
    }, self.SHOW_TIME);
};    


Map.prototype.switchToNight = function () {
    var self = this;
    self.activePattern = self.mapNightPattern;
    self.background.animate({
        opacity: 0,
    }, self.HIDE_TIME);
};


Map.prototype.setDaytimeIcons = function () {
    var self = this,
        // made HARD
        dayIcon = {
            source: 'img/sun-icon.png',
            coords: [[0, 0]]
        },
        nightIcon = {
            source: 'img/moon-icon.png',
            coords: [[1570, 0]]
        };
    self.setCustomIcons(dayIcon, self.switchToDay);  
    self.setCustomIcons(nightIcon, self.switchToNight);  
};

/**------------------------------------------------------------------------------------
                            подсветка нужных областей (одна группа)
--------------------------------------------------------------------------------------*/
Map.prototype.onGroupSelect = function () {
    var self = this,
        activeClass = 'active';
    for (var i = 0, l = self.backlightButton.length; i < l; i++) {
        self.backlightButton[i].onclick = function () {
            var btn = this,
                type = btn.getAttribute('data-type');
            if (self.shadowLayer) {
                self.hideSVG(self.shadowLayer, true);
            }
            if (self.canvas.select('g#groups')) {
                self.hideSVG(self.maskLayer, true);
            }
            // если класс кнопки уже содержит активный класс
            if (btn.className.indexOf(activeClass) != -1) {
                console.log(btn.className);
                btn.className = btn.className.replace(' ' + activeClass + ' ', '');
                self.hideSVG(self.maskLayer, true);
            } else {
                for (var i = 0, l = self.backlightButton.length; i < l; i++) {
                    self.backlightButton[i].className = self.backlightButton[i].className.replace(' ' +  activeClass  + ' ', '');
                }
                self.maskLayer = self.setShadow().attr({id: 'groups'});
                btn.className = btn.className + ' ' + activeClass + ' ';
                self.backlightGroup(type);
            }
        };
    }
};


Map.prototype.backlightGroup = function (type) {
    var self = this,
        group = self.groupLayers[type],
        groupClone = group.clone(),
        cloneObjects = groupClone.selectAll('g'),
        objClone, hoverObj;
    groupClone.appendTo(self.maskLayer);
    for (var i=0, grouplength = cloneObjects.length; i < grouplength; i++ ) {
        objClone = cloneObjects[i].select('path');
        hoverObj = objClone.clone();
        objClone.attr({
            opacity: 1,
            fill: self.activePattern
        });
        hoverObj.click( function (e) {
            self.objClickCallback(this);   
        });
        self.onPathHover(hoverObj);
    }
    self.showSVG(self.maskLayer);
};