let highestZ = 1;
class Paper {
  el = null;
  holdingPaper = false;
  broughtToFront = false;
  dragStartMouseX = 0;
  dragStartMouseY = 0;
  dragStartPaperX = 0;
  dragStartPaperY = 0;
  mouseTouchX = 0;
  mouseTouchY = 0;
  mouseX = 0;
  mouseY = 0;
  prevMouseX = 0;
  prevMouseY = 0;
  velX = 0;
  velY = 0;
  rotation = Math.random() * 30 - 15;
  currentPaperX = 0;
  currentPaperY = 0;
  rotating = false;
  init(paper) {
    this.el = paper;
    const stage = document.querySelector('.stage');
    const stageRect = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 };
    const rect = paper.getBoundingClientRect();
    this.currentPaperX = rect.left - stageRect.left;
    this.currentPaperY = rect.top - stageRect.top;
    paper.style.left = this.currentPaperX + 'px';
    paper.style.top = this.currentPaperY + 'px';
    paper.style.transform = 'rotateZ(' + this.rotation + 'deg)';

    paper.addEventListener('contextmenu', (ev) => ev.preventDefault());

    // Função genérica para iniciar o movimento
    const startHandler = (e) => {
      if(this.holdingPaper) return;
      this.holdingPaper = true;
      activePaper = this;
      
      // Diferenciar Mouse de Touch
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const elRect = this.el.getBoundingClientRect();
      const stageRef = document.querySelector('.stage') || document.body;
      const stageRectRef = stageRef.getBoundingClientRect();
      
      this.mouseOffsetX = clientX - elRect.left;
      this.mouseOffsetY = clientY - elRect.top;
      this.dragStartPaperX = this.currentPaperX;
      this.dragStartPaperY = this.currentPaperY;
      
      this.mouseTouchX = clientX;
      this.mouseTouchY = clientY;

      // No celular, não temos botão direito, então a rotação pode ser omitida ou feita com dois dedos
      if(!e.touches && e.button === 2) {
        this.rotating = true;
      }
    };

    paper.addEventListener('mousedown', startHandler);
    paper.addEventListener('touchstart', startHandler, { passive: false });

    window.addEventListener('mouseup', () => {
      this.holdingPaper = false;
      this.rotating = false;
    });
    window.addEventListener('touchend', () => {
      this.holdingPaper = false;
      this.rotating = false;
    });
  }

  // permite definir posição relativa à .stage
  setPosition(x, y) {
    this.currentPaperX = x;
    this.currentPaperY = y;
    if(this.el) {
      this.el.style.left = this.currentPaperX + 'px';
      this.el.style.top = this.currentPaperY + 'px';
      this.el.style.transform = 'rotateZ(' + this.rotation + 'deg)';
    }
  }
}
const paperEls = Array.from(document.querySelectorAll('.paper'));
const stageEl = document.querySelector('.stage') || document.body;
const paperInstances = [];

function loadImagesInStage() {
  const imgs = Array.from(document.querySelectorAll('.stage img'));
  return Promise.all(imgs.map(img => {
    return new Promise(resolve => {
      if(img.complete) return resolve();
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
    })
  }));
}

window.addEventListener('load', async () => {
  await loadImagesInStage();

  // inicializa cada Paper e guarda a instância
  paperEls.forEach((paperEl, i) => {
    const p = new Paper();
    p.init(paperEl);
    paperInstances.push(p);
  });

  // depois que todos inicializados e imagens carregadas, recalc e centraliza
  const stageRect = stageEl.getBoundingClientRect();
  paperEls.forEach((paperEl, i) => {
    const rect = paperEl.getBoundingClientRect();
    const centerX = (stageRect.width - rect.width) / 2;
    const centerY = (stageRect.height - rect.height) / 2;
    const offsetY = i * 8; // pequeno espaço entre cada papel
    const inst = paperInstances[i];
    if(inst) {
      inst.setPosition(Math.round(centerX), Math.round(centerY + offsetY));
      inst.el.style.zIndex = i + 1;
    } else {
      // fallback
      paperEl.style.left = Math.round(centerX) + 'px';
      paperEl.style.top = Math.round(centerY + offsetY) + 'px';
      paperEl.style.zIndex = i + 1;
    }
  });

  // depois de posicionar, revelar suavemente os papéis
  paperInstances.forEach(inst => inst.el.classList.add('visible'));
});

// --- Pan (arrastar o fundo) ---
const stage = document.querySelector('.stage');
let stageOffsetX = 0;
let stageOffsetY = 0;
let stagePanning = false;
let panStartX = 0;
let panStartY = 0;

// Gerenciador global de mouse para arraste/rotação de papéis
let activePaper = null;
const handleMove = (e) => {
  if(!activePaper) return;
  
  // Evita que a tela suba ou desça enquanto você arrasta o papel
  if(e.type === 'touchmove') e.preventDefault();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const paperObj = activePaper;
  const paperEl = paperObj.el;

  // Arraste
  if(paperObj.holdingPaper && !paperObj.rotating) {
    const stageRef = document.querySelector('.stage') || document.body;
    const stageRect = stageRef.getBoundingClientRect();
    
    const targetMouseX = clientX - stageRect.left - (paperObj.mouseOffsetX || 0);
    const targetMouseY = clientY - stageRect.top - (paperObj.mouseOffsetY || 0);
    
    const dx = targetMouseX - paperObj.dragStartPaperX;
    const dy = targetMouseY - paperObj.dragStartPaperY;

    if(!paperObj.broughtToFront) {
      paperEl.style.zIndex = highestZ;
      highestZ += 1;
      paperObj.broughtToFront = true;
    }

    paperObj.currentPaperX = paperObj.dragStartPaperX + dx;
    paperObj.currentPaperY = paperObj.dragStartPaperY + dy;
    paperEl.style.left = paperObj.currentPaperX + 'px';
    paperEl.style.top = paperObj.currentPaperY + 'px';
  }
};

document.addEventListener('mousemove', handleMove);
document.addEventListener('touchmove', handleMove, { passive: false });

document.addEventListener('mouseup', () => {
  if(activePaper) {
    console.log('[paper] mouseup', { idx: activePaper.el.dataset.idx, left: activePaper.currentPaperX, top: activePaper.currentPaperY });
    activePaper.holdingPaper = false;
    activePaper.rotating = false;
    activePaper.broughtToFront = false;
    activePaper = null;
  }
});

if(stage) {
  // ... mantenha seu código de mousedown ...

  // ADICIONE ESTE OUVINTE DE TOQUE PARA O FUNDO:
  stage.addEventListener('touchstart', (e) => {
    if(e.target !== stage) return;
    stagePanning = true;
    panStartX = e.touches[0].clientX;
    panStartY = e.touches[0].clientY;
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if(!stagePanning) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    
    const dx = clientX - panStartX;
    const dy = clientY - panStartY;
    stageOffsetX += dx;
    stageOffsetY += dy;
    stage.style.transform = `translate(${stageOffsetX}px, ${stageOffsetY}px)`;
    panStartX = clientX;
    panStartY = clientY;
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if(stagePanning) {
      stagePanning = false;
    }
  });
}
