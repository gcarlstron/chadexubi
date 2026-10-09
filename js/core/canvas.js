'use strict';
// =====================================================================
//  core/canvas.js — canvas da tela (out) e buffer pixel-art 320x180 (ctx)
//  O jogo desenha em `ctx` (baixa resolucao) e o texto em `out` (nitido).
// =====================================================================
const cv = document.getElementById('game');
const out = cv.getContext('2d');
const buf = document.createElement('canvas'); buf.width = VW; buf.height = VH;
const ctx = buf.getContext('2d');
let S = 1, OX = 0, OY = 0; // escala e deslocamento do buffer na tela
function resize() {
  cv.width = innerWidth; cv.height = innerHeight;
  let s = Math.min(innerWidth / VW, innerHeight / VH);
  if (s >= 1) s = Math.floor(s);
  S = s; OX = Math.floor((innerWidth - VW * S) / 2); OY = Math.floor((innerHeight - VH * S) / 2);
}
addEventListener('resize', resize); resize();
