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
    // inicializa posição do papel a partir de sua posição dentro da .stage
    const stage = document.querySelector('.stage');
    const stageRect = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 };
    const rect = paper.getBoundingClientRect();
    this.currentPaperX = rect.left - stageRect.left;
    this.currentPaperY = rect.top - stageRect.top;
    paper.style.left = this.currentPaperX + 'px';
    paper.style.top = this.currentPaperY + 'px';
    paper.style.transform = 'rotateZ(' + this.rotation + 'deg)';

    
    // evitar menu de contexto (permite usar botão direito para rotacionar)
    paper.addEventListener('contextmenu', (ev) => ev.preventDefault());

    paper.addEventListener('mousedown', (e) => {
      if(this.holdingPaper) return;
      this.holdingPaper = true;
      this.broughtToFront = false;
      // marcar como ativo global para o gerenciador único
      activePaper = this;
      // debug
      try {
        const label = (this.el.querySelector('p') && this.el.querySelector('p').innerText.trim().split('\n')[0]) || this.el.className;
        console.log('[paper] mousedown', { label, left: this.currentPaperX, top: this.currentPaperY });
      } catch(e) {}
      // usar coordenadas do evento para iniciar arraste/rotação
      if(e.button === 0) {
        // iniciar arraste: registrar posição inicial do mouse e do papel
        // e também o offset do mouse dentro do elemento para arraste estável
        const elRect = this.el.getBoundingClientRect();
        const stage = document.querySelector('.stage') || document.body;
        const stageRect = stage.getBoundingClientRect();
        this.mouseOffsetX = e.clientX - elRect.left;
        this.mouseOffsetY = e.clientY - elRect.top;
        // dragStartPaperX/Y em coordenadas da stage
        this.dragStartPaperX = this.currentPaperX;
        this.dragStartPaperY = this.currentPaperY;
        this.dragStartMouseX = e.clientX - stageRect.left - this.mouseOffsetX;
        this.dragStartMouseY = e.clientY - stageRect.top - this.mouseOffsetY;
        this.mouseTouchX = e.clientX;
        this.mouseTouchY = e.clientY;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      }
      if(e.button === 2) {
        // inicia rotação a partir da posição do clique
        this.rotating = true;
        this.mouseTouchX = e.clientX;
        this.mouseTouchY = e.clientY;
      }
    });
    window.addEventListener('mouseup', () => {
      this.holdingPaper = false;
      this.rotating = false;
      this.broughtToFront = false;
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
document.addEventListener('mousemove', (e) => {
  if(!activePaper) return;
  const paperObj = activePaper;
  const paperEl = paperObj.el;
  // atualizar posição do mouse
  paperObj.mouseX = e.clientX;
  paperObj.mouseY = e.clientY;

  // rotação
  if(paperObj.rotating) {
    const dirX = e.clientX - paperObj.mouseTouchX;
    const dirY = e.clientY - paperObj.mouseTouchY;
    const dirLength = Math.sqrt(dirX*dirX+dirY*dirY) || 1;
    const angle = Math.atan2(dirY/dirLength, dirX/dirLength);
    let degrees = 180 * angle / Math.PI;
    degrees = (360 + Math.round(degrees)) % 360;
    paperObj.rotation = degrees;
    paperEl.style.transform = 'rotateZ(' + paperObj.rotation + 'deg)';
    console.log('[paper] rotating', { label: paperEl.dataset.idx || paperEl.className, rot: paperObj.rotation });
  }

  // arraste
  if(paperObj.holdingPaper && !paperObj.rotating) {
    const stageRef = document.querySelector('.stage') || document.body;
    const stageRect = stageRef.getBoundingClientRect();
    const targetMouseX = e.clientX - stageRect.left - (paperObj.mouseOffsetX || 0);
    const targetMouseY = e.clientY - stageRect.top - (paperObj.mouseOffsetY || 0);
    const dx = targetMouseX - paperObj.dragStartPaperX;
    const dy = targetMouseY - paperObj.dragStartPaperY;
    const dragDist = Math.sqrt(dx*dx + dy*dy);
    if(!paperObj.broughtToFront && dragDist > 4) {
      console.log('[paper] bringToFront', { idx: paperEl.dataset.idx, label: paperEl.querySelector('p') ? paperEl.querySelector('p').innerText.split('\n')[0] : paperEl.className, dragDist });
      paperEl.style.zIndex = highestZ;
      highestZ += 1;
      paperObj.broughtToFront = true;
    }
    paperObj.currentPaperX = paperObj.dragStartPaperX + dx;
    paperObj.currentPaperY = paperObj.dragStartPaperY + dy;
    paperEl.style.left = paperObj.currentPaperX + 'px';
    paperEl.style.top = paperObj.currentPaperY + 'px';
  }
});

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
  // garantir transform inicial
  stage.style.transform = `translate(${stageOffsetX}px, ${stageOffsetY}px)`;

  stage.addEventListener('mousedown', (e) => {
    // só iniciar pan se clicar no fundo (não em um .paper)
    if(e.target !== stage) return;
    stagePanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    document.body.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if(!stagePanning) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    stageOffsetX += dx;
    stageOffsetY += dy;
    stage.style.transform = `translate(${stageOffsetX}px, ${stageOffsetY}px)`;
    panStartX = e.clientX;
    panStartY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    if(stagePanning) {
      stagePanning = false;
      document.body.style.cursor = '';
    }
  });
}
