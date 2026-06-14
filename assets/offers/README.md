# Photos d'offres (locales)

Dépose ici les vraies photos produit, en JPG/PNG, nommées par thème + numéro à 2 chiffres.
Je les câblerai ensuite sur les offres correspondantes (override de l'image loremflickr).

```
assets/offers/
  sneakers/   01.jpg 02.jpg … 10.jpg
  manteaux/   01.jpg 02.jpg … 10.jpg
  papa/       01.jpg 02.jpg … 10.jpg   (idées cadeau fête des pères)
```

Contraintes : format paysage ou carré, ~800×600+ idéal, < 1.5 Mo chacune.
Quand les fichiers sont là, dis-le-moi : je crée `src/data/localImages.ts`
(`require(...)` statiques) et j'assigne chaque photo à son offre par thème.
