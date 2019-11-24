import Snap from 'snapsvg';

function roundNumber(num, scale=4) {
  if (!('' + num).includes('e')) {
    return +(Math.round(num + 'e+' + scale)  + 'e-' + scale);
  } else {
    var arr = ('' + num).split('e');
    var sig = '';
    if(+arr[1] + scale > 0) {
      sig = '+';
    }
    return +(Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) + 'e-' + scale);
  }
};

function d2(num) {
  return roundNumber(num, 2);
}

/**
 * excerpted from lottie-web. convert relative in/out bezier points
 * to absolute coordiate system values.
 */
export function convertPathsToAbsoluteValues(path){
  var i, len = path.i.length;
  for (i = 0; i < len; i += 1){
      path.i[i][0] += path.v[i][0];
      path.i[i][1] += path.v[i][1];
      path.o[i][0] += path.v[i][0];
      path.o[i][1] += path.v[i][1];
  }
}

/**
 * convert from standard SVG coordinate system to bodymovin's coordinate system.
 * the paths returned from fontkit is [unitsPerEm]px, origin (0, 0)
 * unitsPerEm varies from font to font, usually 1000px, sometimes 1024px
 * or may be other values.
 * SVG font coordinate system is horizontally flipped comparing
 * to normal SVG graphincs coordinate system.
 * Hence, we scale down the path to 100px, and flip it horizontally
 */
function convertToBodymovinCoordinate(points, unitsPerEm) {
  const targetSize = 100; // bodymovin export character glyphs at 100px
  return points.map(part => {
    return part.map((item, i) => {
      if (i === 0) {
        // the drawing command
        return item;
      }
      if (i % 2 === 0) {
        // y value
        return -targetSize * item / unitsPerEm;
      }
      else {
        // x value
        return targetSize * item / unitsPerEm;
      }
    });
  });
}

/**
 * convert points returned by convertToBodymovinCoordinate method to [{v:[], i:[], o:[]}, ...] format
 * @param {array} points - each item is an array with the 1st item set to the drawing method, the following items as x/y coordinate pairs
 * @returns {array} - each item is an object containing points data in bodymovin format, which has 3 objects, namely v(anchor points, relative to origin), i(in bezier points, relative to v), and o(out bezier points, relative to v)
 */
function convertToBodymovinStructure(points) {
  const set = [];
  let v, i, o, start;
  points.forEach((part, index) => {
    if (part[0] === 'M') {
      start = index;
      v = [[d2(part[1]), d2(part[2])]];
      i = [];
      o = [];
      set.push({v, i, o});
    }
    else {
      // part[0] must be 'C'
      const prev = points[index - 1];
      const prevX = prev[0] === 'M' ? prev[1] : prev[5];
      const prevY = prev[0] === 'M' ? prev[2] : prev[6];
      if (
        index+1 === points.length || // the last command of the last group
        points[index+1][0] === 'M' // the last command of current group
      ) {
        o.push([d2(part[1]-prevX), d2(part[2]-prevY)]); // relative to previous anchor point

        const first = points[start];
        i.unshift([d2(part[3]-first[1]), d2(part[4]-first[2])]); // relative to the first point
      }
      else {
        o.push([d2(part[1]-prevX), d2(part[2]-prevY)]); // relative to previous anchor point
        i.push([d2(part[3]-part[5]), d2(part[4]-part[6])]); // relative to current anchor point
        v.push([d2(part[5]), d2(part[6])]); // current anchor point
      }
    }
  });

  return set;
}

/**
 * add extra structures for points returned by convertToBodymovinStructure method, assemble "it"(items) property of shapes
 * @param {array} points - points array in [{v:[], i:[], o:[]}, ...] format
 * @param {string} name - layer name, usually be the character literal
 * @returns {array} - points array with extra atrributes like "ind"(index), "ty"(type), etc. added to each array item
 */
function assembleBodymovinStructure(points, name) {
  return points.map((group, index) => {
    return {
      ind: index, // index
      ty: 'sh', // type: shape
      ix: index + 1, // property index, I don't know what it is
      ks: { // vertices
        a: 0, // not animated
        k: { // property value
          i: group.i, // bezier curve in points, relative to v
          o: group.o, // bezier curve out points, relative to v
          v: group.v, // bezier curve vertices, relative to (0, 0)
          c: true, // I think all parts of character glyphs are closed paths
        },
        ix: 2, // property index, looks like it's always 2
      },
      nm: name,
      mn: 'ADBE Vector Shape - Group', // match name
      hd: false, // looks like it's short for hidden
    };
  });
}

/**
 * convert a character to bodymovin outline
 * @param {object} font - the font object loaded by fontkit
 * @param {string} char - the character string
 * @param {object} fontInfo - font info
 * @param {string} fontInfo.name - font's postscript name, containing family, style and weight, same as lottie fName
 * @param {string} fontInfo.family - font family, same as lottie fFamily
 * @param {number} fontInfo.size - font size. Doesn't influence generated glyphs, just sets the size property
 * @param {string} fontInfo.style - font style. CSS font-weight and font-style are grouped together, e.g. Regular, Italic, Bold, Black Italic, etc. same as lottie fStyle
 */
export function convertChar(font, char, fontInfo) {
  const targetSize = 100; // bodymovin export character glyphs at 100px
  const unitsPerEm = font.unitsPerEm;
  const glyph = font.glyphForCodePoint(char.charCodeAt(0));
  const d = glyph.path.toSVG();

  let data, charWidth;
  if (d) {
    // characters like ' ' doesn't have empty d
    const items = assembleBodymovinStructure(convertToBodymovinStructure(convertToBodymovinCoordinate(Snap.path.toCubic(d), unitsPerEm)), char);
    data = {shapes: [{
      ty: 'gr', // type group
      it: items,
      nm: char,
      np: items.length === 1 ? 3 : items.length + 3, // TODO: figure out what this number is
      cix: 2, // don't know what is means, looks like it should be always be 2
      ix: 1, // don't know what is means, looks like it should be always be 1
      mn: 'ADBE Vector Group',
      hd: false,
    }]};
    charWidth = glyph.advanceWidth;
  }
  else {
    // should be space character
    data = {};
    charWidth = glyph.cbox.maxX - glyph.cbox.minX;
    if (!isFinite(charWidth)) {charWidth = 250;}
  }

  const props = {
    ch: char,
    size: fontInfo.size,
    style: fontInfo.style || 'Regular',
    w: d2(charWidth * targetSize / unitsPerEm),
    data,
    fFamily: fontInfo.family,
  };

  return props;
}
