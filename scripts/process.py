# Gera imagens e data/produtos.json da Gold Tabacaria + CSV de preços.
# Vidros: fotos do catálogo 2026 (/workspace/gold-cat/crops), códigos G<pág>-<pos>.
# Maçaricos/isqueiros: fotos ilustrativas do Wikimedia Commons (ver creditos.html e /workspace/gold-cat/fontes.txt).
import glob, os, json, csv
from PIL import Image
S = '/workspace/gold-cat/crops'; SRC = '/workspace/gold-cat/src'
prods = []
def salvar(im, pid):
  for d, w in (('p', 900), ('t', 480)):
    x = im.copy(); x.thumbnail((w, w * 2)); x.save(f'img/{d}/{pid}.webp', quality=84 if d == 'p' else 80)
for f in sorted(glob.glob(S + '/prod-*.jpg')):
  old = os.path.basename(f)[5:-4]; pid = 'G' + old[1:]
  im = Image.open(f).convert('RGB'); salvar(im, pid)
  pg, pos = old[1:].split('-')
  prods.append({'id': pid, 'categoria': 'vidro', 'pagina': int(pg), 'posicao': int(pos), 'nome': f'Peça de vidro {pid}', 'preco': None, 'img': pid, 'w': im.width, 'h': im.height, 'codigo': pid, 'tamanhos': [], 'cores': []})

def moldura(path, pid, crop=None, ratio=0.73, tight=False):
  im = Image.open(path).convert('RGB')
  if crop: im = im.crop(crop)
  if tight:  # recorta rente ao objeto (fundo claro)
    from PIL import ImageChops
    bgc = Image.new('RGB', im.size, im.getpixel((2, 2))); bb = ImageChops.difference(im, bgc).convert('L').point(lambda v: 255 if v > 40 else 0).getbbox()
    if bb: m = 24; im = im.crop((max(0, bb[0] - m), max(0, bb[1] - m), min(im.width, bb[2] + m), min(im.height, bb[3] + m)))
  px = [im.getpixel(p) for p in ((2, 2), (im.width - 3, 2), (2, im.height - 3), (im.width - 3, im.height - 3))]
  bg = tuple(sorted(c[i] for c in px)[1] for i in range(3))
  H = 1250; W = int(H * ratio); can = Image.new('RGB', (W, H), bg)
  t = im.copy(); t.thumbnail((int(W * .90), int(H * .90))); can.paste(t, ((W - t.width) // 2, (H - t.height) // 2)); salvar(can, pid); return W, H
EXTRA = [
  ('macarico', 'G-MAC-01', 'Maçarico tipo lápis', 'macarico-1.jpg', None, False),
  ('macarico', 'G-MAC-02', 'Maçarico de bancada', 'macarico-3.jpg', (0, 0, 780, 455), True),
  ('isqueiro', 'G-ISQ-01', 'Isqueiro descartável azul', 'isq-2.jpg', None, False),
  ('isqueiro', 'G-ISQ-02', 'Isqueiros coloridos (sortidos)', 'isq-1.jpg', None, False),
  ('isqueiro', 'G-ISQ-03', 'Isqueiro de metal preto', 'isq-3.jpg', (420, 150, 1700, 1400), False),
]
for i, (cat, pid, nome, fn, crop, tight) in enumerate(EXTRA):
  w, h = moldura(f'{SRC}/{fn}', pid, crop, 0.73, tight)
  prods.append({'id': pid, 'categoria': cat, 'pagina': 0, 'posicao': i + 1, 'nome': nome, 'preco': None, 'img': pid, 'w': w, 'h': h, 'codigo': pid, 'tamanhos': [], 'cores': [], 'ilustrativa': True})
json.dump(prods, open('data/produtos.json', 'w'), ensure_ascii=False, indent=1)
os.makedirs('/workspace/gold-cat', exist_ok=True)
with open('/workspace/gold-cat/precos-template.csv', 'w', newline='', encoding='utf-8-sig') as fh:
  w = csv.writer(fh, delimiter=';')
  w.writerow(['id', 'categoria', 'nome_atual', 'imagem', 'nome', 'preco', 'peso_kg', 'comprimento_cm', 'largura_cm', 'altura_cm', 'observacao'])
  for p in prods:
    ph = 'foto ILUSTRATIVA (Wikimedia) - trocar pela foto real' if p.get('ilustrativa') else ''
    w.writerow([p['id'], p['categoria'], p['nome'], f"img/p/{p['id']}.webp", '', '', '', '', '', '', ph])
from collections import Counter
print(len(prods), Counter(p['categoria'] for p in prods))
