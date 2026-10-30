/* Gold Tabacaria — vitrine + sacola (sacola só ativa com vendasAtivas e preço > 0) */
(function () {
  'use strict';
  var C = window.LOJA_CONFIG || {};
  var API = C.apiPagamento || '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); };
  var temPreco = function (p) { return Number(p.preco) > 0; };
  var podeComprar = function (p) { return !!C.vendasAtivas && temPreco(p); };
  var produtos = [], filtro = 'todas', busca = '';

  // ---------- portão 18+ ----------
  var gate = $('#ageGate');
  function fecharGate() { gate.hidden = true; document.documentElement.classList.remove('gate-open'); iniciarVideo(); }
  if (localStorage.getItem('gold18') === 'ok') fecharGate();
  $('#ageYes').onclick = function () { try { localStorage.setItem('gold18', 'ok'); } catch (e) {} fecharGate(); };
  $('#ageNo').onclick = function () { $('#ageNoMsg').hidden = false; document.querySelector('main').innerHTML = ''; };

  // ---------- vídeo ----------
  var videoOk = false;
  function iniciarVideo() {
    if (videoOk) return; videoOk = true;
    var v = $('#heroVideo'); if (!v) return;
    var base = matchMedia('(min-width: 768px)').matches ? v.dataset.d : v.dataset.m;
    v.poster = base + '-poster.webp';
    v.innerHTML = '<source src="' + base + '.webm" type="video/webm"><source src="' + base + '.mp4" type="video/mp4">';
    v.load(); var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  // ---------- topo / animações ----------
  var tb = $('#topbar');
  addEventListener('scroll', function () { tb.classList.toggle('is-solid', scrollY > 40); }, { passive: true });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 }) : null;
  document.querySelectorAll('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  $('#year').textContent = new Date().getFullYear();

  // ---------- catálogo ----------
  var CATS = [['vidro', 'Vidros', 'Peça de vidro'], ['macarico', 'Maçaricos', 'Maçarico'], ['isqueiro', 'Isqueiros', 'Isqueiro']];
  var catNome = function (c) { var x = CATS.find(function (k) { return k[0] === c; }); return x ? x[1] : ''; };
  var catSing = function (c) { var x = CATS.find(function (k) { return k[0] === c; }); return x ? x[2] : 'Peça'; };
  function card(p) {
    var preco = temPreco(p) ? '<span class="card__price">' + money(p.preco) + '</span>' : '<span class="card__soon">Preço em breve</span>';
    var ilus = p.ilustrativa ? '<span class="card__ilus">Foto ilustrativa</span>' : '';
    var buy = podeComprar(p) ? '<button class="card__btn" data-add="' + esc(p.codigo) + '">Adicionar à sacola</button>'
      : '<button class="card__buy" disabled title="Compra online disponível em breve">Compra online em breve</button>';
    return '<article class="card reveal" data-codigo="' + esc(p.codigo) + '">' +
      '<button class="card__img" data-open="' + esc(p.codigo) + '" aria-label="Ver ' + esc(p.nome) + '"><img src="img/t/' + esc(p.img) + '.webp" alt="' + esc(p.nome) + '" loading="lazy" decoding="async" width="480" height="656"></button>' +
      '<div class="card__body"><h3 class="card__name">' + esc(p.nome) + '</h3><span class="card__code">Cód. ' + esc(p.codigo) + '</span>' + preco + ilus +
      '<div class="card__btns">' + buy + '</div></div></article>';
  }
  function render() {
    var lista = produtos.filter(function (p) {
      return (filtro === 'todas' || p.categoria === filtro) && (!busca || p.codigo.toLowerCase().indexOf(busca) >= 0 || p.nome.toLowerCase().indexOf(busca) >= 0);
    });
    var html = '';
    CATS.forEach(function (c) {
      var g = lista.filter(function (p) { return p.categoria === c[0]; });
      if (!g.length) return;
      html += '<div class="cat-head" id="cat-' + c[0] + '"><h3>' + c[1] + '</h3><span>' + g.length + (g.length === 1 ? ' item' : ' itens') + '</span></div>' + g.map(card).join('');
    });
    $('#grid').innerHTML = html || '<p class="empty">Nenhum item encontrado. Tente outro nome ou código.</p>';
    $('#resultInfo').textContent = lista.length + (lista.length === 1 ? ' item' : ' itens');
    document.querySelectorAll('#grid .reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  }
  function filtros() {
    var n = function (c) { return produtos.filter(function (p) { return p.categoria === c; }).length; };
    $('#filters').innerHTML = '<button class="chip" aria-selected="true" data-f="todas" role="tab">Todos (' + produtos.length + ')</button>' +
      CATS.map(function (c) { return '<button class="chip" aria-selected="false" data-f="' + c[0] + '" role="tab">' + c[1] + ' (' + n(c[0]) + ')</button>'; }).join('');
  }
  $('#filters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]'); if (!b) return; filtro = b.dataset.f;
    document.querySelectorAll('#filters .chip').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); }); render();
  });
  $('#search').addEventListener('input', function (e) { busca = e.target.value.trim().toLowerCase(); render(); });

  // ---------- modal ----------
  var modal = $('#productModal');
  function abrir(cod) {
    var p = produtos.find(function (x) { return x.codigo === cod; }); if (!p) return;
    $('#pmBody').innerHTML = '<div class="pm__gallery"><img src="img/p/' + esc(p.img) + '.webp" alt="' + esc(p.nome) + '"></div>' +
      '<div class="pm__info"><span class="pm__code">Cód. ' + esc(p.codigo) + ' · ' + esc(catNome(p.categoria)) + (p.categoria === 'vidro' ? ' · Catálogo 2026, página ' + p.pagina : '') + '</span><h2 class="pm__title" id="pmTitle">' + esc(p.nome) + '</h2>' +
      '<p class="pm__price">' + (temPreco(p) ? money(p.preco) : 'Preço em breve') + '</p>' +
      '<p class="pm__desc">' + (p.categoria === 'vidro' ? 'Peça em vidro, enviada em embalagem reforçada. ' : '') + (p.ilustrativa ? 'Foto ilustrativa: o modelo e a marca disponíveis podem variar. ' : '') + 'Fale com a gente para saber medidas, preço e frete. Venda somente para maiores de 18 anos.</p>' +
      (podeComprar(p) ? '<button class="btn btn--grad btn--block" data-add="' + esc(p.codigo) + '" style="margin-top:10px">Adicionar à sacola</button>' : '<p class="result-info" style="margin-top:12px">Compra online pelo Mercado Pago disponível em breve.</p>') + '</div>';
    modal.hidden = false;
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { abrir(o.dataset.open); return; }
    if (e.target.closest('[data-close]')) modal.hidden = true;
    var a = e.target.closest('[data-add]'); if (a) addCarrinho(a.dataset.add);
    if (e.target.closest('[data-close-cart]')) $('#cartDrawer').hidden = true;
  });

  // ---------- sacola + checkout (Mercado Pago + Melhor Envio via Worker) ----------
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('gold_cart') || '[]'); } catch (e) {}
  function salvar() { try { localStorage.setItem('gold_cart', JSON.stringify(cart)); } catch (e) {} }
  function addCarrinho(cod) {
    var p = produtos.find(function (x) { return x.codigo === cod; });
    if (!p || !podeComprar(p)) return; // nunca vende peça sem preço
    var l = cart.find(function (x) { return x.codigo === cod; }); l ? l.qtd = Math.min(5, l.qtd + 1) : cart.push({ codigo: cod, qtd: 1 });
    salvar(); modal.hidden = true; abrirSacola();
  }
  var freteSel = null;
  function itensValidos() { return cart.filter(function (l) { var p = produtos.find(function (x) { return x.codigo === l.codigo; }); return p && podeComprar(p); }); }
  function post(rota, body) {
    return fetch(API + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
.then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw j; return j; }); });
  }
  function abrirSacola() {
    var itens = itensValidos(); var b = $('#cartBody');
    if (!itens.length) { b.innerHTML = '<p>Sua sacola está vazia.</p>'; $('#cartDrawer').hidden = false; return; }
    var sub = 0;
    b.innerHTML = itens.map(function (l) { var p = produtos.find(function (x) { return x.codigo === l.codigo; }); sub += p.preco * l.qtd; return '<p>' + l.qtd + '× ' + esc(p.nome) + ' — ' + money(p.preco * l.qtd) + '</p>'; }).join('') +
      '<p><b>Subtotal: ' + money(sub) + '</b></p><label>CEP <input id="cCep" inputmode="numeric" autocomplete="postal-code"></label> <button class="btn" id="cFrete" type="button">Calcular frete</button><div id="cOpc"></div>' +
      '<form id="cForm" hidden>' + ['nome:Nome completo', 'email:E-mail', 'telefone:WhatsApp', 'cpf:CPF', 'rua:Rua', 'numero:Número', 'complemento:Complemento', 'bairro:Bairro', 'cidade:Cidade', 'uf:UF'].map(function (f) { var k = f.split(':'); return '<label>' + k[1] + ' <input name="' + k[0] + '"' + (k[0] === 'complemento' ? '' : ' required') + '></label>'; }).join('') +
      '<label><input type="checkbox" required> Declaro ter 18 anos ou mais</label><button class="btn btn--mp btn--block" type="submit">Pagar com Mercado Pago</button><p id="cMsg" role="alert"></p></form>';
    $('#cartDrawer').hidden = false;
    $('#cFrete').onclick = function () {
      post('/frete', { cep_destino: $('#cCep').value, itens: itens }).then(function (j) {
        freteSel = j.opcoes[0];
        $('#cOpc').innerHTML = j.opcoes.map(function (o, i) { return '<label><input type="radio" name="fr" value="' + i + '"' + (i ? '' : ' checked') + '> ' + esc(o.empresa + ' ' + o.nome + ' — ' + o.prazo_texto + ' — ' + money(o.preco)) + '</label><br>'; }).join('');
        $('#cOpc').onchange = function (e) { freteSel = j.opcoes[+e.target.value]; };
        var f = $('#cForm'); f.hidden = false; if (j.destino) { f.rua.value = j.destino.rua || ''; f.bairro.value = j.destino.bairro || ''; f.cidade.value = j.destino.cidade || ''; f.uf.value = j.destino.uf || ''; }
      }).catch(function (e) { $('#cOpc').textContent = (e && e.erro) || 'Não foi possível calcular o frete.'; });
    };
    $('#cForm').onsubmit = function (ev) {
      ev.preventDefault(); var f = ev.target, cli = { cep: $('#cCep').value };
      ['nome', 'email', 'telefone', 'cpf', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf'].forEach(function (k) { cli[k] = f[k].value; });
      post('/checkout', { itens: itens, frete: { servico_id: freteSel.servico_id, preco: freteSel.preco }, cliente: cli, pagamento: 'cartao_boleto' })
.then(function (j) { try { localStorage.setItem('gold_pedido', j.pedido_id); } catch (e) {} location.href = j.init_point; })
.catch(function (e) { $('#cMsg').textContent = (e && e.erro) || 'Não foi possível abrir o pagamento. Fale no WhatsApp.'; });
    };
  }

  // retorno do Mercado Pago
  if (/#pedido-ok/.test(location.hash)) { cart = []; salvar(); toast('Pedido recebido! Você vai receber a confirmação. Dúvidas no WhatsApp.'); }
  else if (/#pedido-pendente/.test(location.hash)) toast('Assim que o pagamento for confirmado, enviamos seu pedido.');
  else if (/#pedido-erro/.test(location.hash)) toast('Pagamento não concluído. Tente de novo ou fale no WhatsApp.');
  function toast(m) { var t = $('#toast'); t.textContent = m; t.hidden = false; setTimeout(function () { t.hidden = true; }, 7000); }

  fetch('data/produtos.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    produtos = d; $('#statCount').textContent = d.length; filtros(); render();
  });
})();
