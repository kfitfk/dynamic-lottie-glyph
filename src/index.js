import "./main.css";
import VeraBd from './fonts/VeraBd.ttf';

import fontkit from 'fontkit';
import blobToBuffer from 'blob-to-buffer';
import Lottie from 'lottie-web';
import {convertChar, convertPathsToAbsoluteValues} from './char';
import sampleData from './sample_lottie_data.json';

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const processed = {};

function loadFont(url) {
  return fetch(url)
  .then(res => res.blob())
  .then(blob => {
    return new Promise((resolve, reject) => {
      blobToBuffer(blob, (err, buffer) => {
        if (err) {reject(err);}
        const font = fontkit.create(buffer);
        resolve(font);
      });
    });
  });
}

function loadLottie(data, ctx) {
  const animation = Lottie.loadAnimation({
    renderer: 'canvas',
    loop: false,
    autoplay: false,
    animationData: data,
    rendererSettings: {
      context: ctx,
      scaleMode: 'noScale',
      clearCanvas: true,
    }
  });
  return new Promise((resolve) => {
    animation.addEventListener('DOMLoaded', () => {
      resolve(animation);
    });
  });
}

function changeTextContent(font, animation, e) {
  const text = e.target.value.trim();

  /**
   * In a real-world project, you must check which text layer's being
   * modified, and what is the target font family. You may also want to
   * have a better cache solution which supports multiple fonts.
   */

  const renderer = animation.renderer;
  const layer = renderer.layers[0];
  const {f:fName, s:fontSize} = layer.t.d.k[0].s;
  const {fFamily, fStyle} = renderer.data.fonts.list[0];

  // Try commenting out the for loop to see the differences in browser console
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (processed[c]) {continue;}

    const charData = convertChar(font, c, {
      name: fName,
      family: fFamily,
      style: fStyle,
      size: fontSize,
    });
    processed[c] = true;

    if (charData.data.shapes) {
      const paths = charData.data.shapes[0].it;
      for (let j = 0; j < paths.length; j += 1) {
        convertPathsToAbsoluteValues(paths[j].ks.k);
        paths[j].ks.k.__converted = true;
      }
    }
    renderer.globalData.fontManager.addChars([charData]);
  }

  renderer.elements[0].updateDocumentData({t: text});

  // force rerender
  renderer.renderFrame(renderer.renderedFrame, true);
}

function bind(font, animation) {
  const inputEl = document.querySelector('#textInput');
  inputEl.addEventListener('input', changeTextContent.bind(null, font, animation), false);
}

Promise.all([
  loadFont(VeraBd),
  loadLottie(sampleData, ctx)
])
  .then(values => {
    bind(values[0], values[1]);
  });
