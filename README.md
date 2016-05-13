# Snap-SVG-Mask

## What does this code do

This module will allow you to impose SVG layer over the image. You don't need to paste the image, just set necessary block element into the settings, and set necessary image and SVG-mask into the settings

## How to use

1. You need to add this script into the head of you site

```
<head>
    ...
    <script type="text/javascript" src="js/snap.svg-min.js"></script>
    <script type="text/javascript" src="js/snap.svg.map-highlight.js"></script>
    <script type="text/javascript" src="js/action.js"></script>
</head>
```

2. Into the `action.js` paste the next code:

```
window.onload = function () {
    var map = new Map({
        container: '.wrapper .map-wrp',
        groupHighlightBtn: '.backlight-btn',
        svg: 'img/map.svg',
        onObjectClick: someFunc,
        image: {
            day: 'img/render.jpg',
            night:'img/render-night.jpg'
        },
        icons: {
            source: 'img/icon-360.png',
            coords: [[400, 280], [530,650], [790, 420]]
        }
    });
    
    function someFunc(obj) {
        id = obj.attr('data-id');
        console.log('id of object: ' + id);
    };
    
    /* example how to work with shadow*/
    document.onkeyup = function() {
        map.hideShadow()
    };
};
```

Where `container` is absolutly any of the existent DOM elements on the site
