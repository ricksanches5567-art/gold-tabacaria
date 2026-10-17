# Gold Tabacaria – loja online
Site estático (GitHub Pages): https://ricksanches5567-art.github.io/gold-tabacaria/

- Categorias: Vidros, Maçaricos, Isqueiros (`categoria` em `data/produtos.json`, gerado por `scripts/process.py`). Códigos: vidros `G<pág>-<pos>` (ex.: G2-03), `G-MAC-nn`, `G-ISQ-nn`.
- Preços: enquanto `preco` for `null` o item mostra "Preço em breve" e não pode ir para a sacola.
- Fotos de maçaricos e isqueiros são ILUSTRATIVAS (Wikimedia Commons); créditos em `creditos.html`. Trocar pelas fotos reais.
- Compra online: `vendasAtivas` em `config.js` (desligada). O servidor de pagamento é um Worker separado e só vende itens com preço > 0.
- Vídeo do topo: `scripts/film.py`. Páginas legais: `scripts/legal.py`.
- Nunca coloque senha, token ou dados de clientes neste repositório (é público).
