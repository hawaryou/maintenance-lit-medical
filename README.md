# ENR08-V05 — Fiche de maintenance lit médicalisé

Projet statique prêt pour GitHub Pages. Le formulaire reprend les rubriques du fichier Excel ENR08-V05 fourni : identification, localisation, contrôles, observations, pièces changées, sécurité et signatures.

## 1. Publier sur GitHub

1. Créez un dépôt GitHub, par exemple `fiche-maintenance-lit-medicalise`.
2. Décompressez ce dossier et envoyez **tous les fichiers** à la racine du dépôt.
3. Dans GitHub : **Settings → Pages → Deploy from a branch → main → /root → Save**.
4. GitHub affichera l’adresse publique de la fiche.

## 2. Activer l'envoi automatique vers valentineuromed@gmail.com

Le destinataire est déjà prévu dans `app.js` : `valentineuromed@gmail.com`.

Pour des raisons de sécurité, les identifiants de service d'envoi ne sont pas inventés et ne doivent pas contenir votre mot de passe Gmail. Créez un compte EmailJS puis créez :

- un service d'e-mail ;
- un template ;
- une clé publique.

Dans `app.js`, remplacez :

- `EMAILJS_PUBLIC_KEY='A_REMPLACER'`
- `EMAILJS_SERVICE_ID='A_REMPLACER'`
- `EMAILJS_TEMPLATE_ID='A_REMPLACER'`

### Variables du template EmailJS

Utilisez au minimum :

- `{{to_email}}` → destinataire
- `{{client}}`
- `{{technicien}}`
- `{{date}}`
- `{{reference}}`
- `{{filename}}`
- `{{attachment}}`

Pour la pièce jointe dynamique, configurez l'attachement du template afin de prendre le champ `attachment` comme contenu Base64 et `filename` comme nom de fichier, conformément à la documentation EmailJS.

## 3. Important

GitHub Pages héberge la page, mais ne fait pas lui-même l'envoi d'e-mails. EmailJS sert uniquement de relais d'envoi. Ne placez jamais un mot de passe Gmail ou une clé secrète serveur dans le JavaScript public.
