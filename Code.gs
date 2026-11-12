/**
 * ENR08-V05 — Réception et envoi automatique des fiches PDF.
 * Déployer ce fichier comme une application Web Google Apps Script.
 */
const DESTINATAIRE = 'valentineuromed@gmail.com';
const NOM_EXPEDITEUR = 'EuroMed - Fiches de maintenance';

function doGet() {
  return ContentService
    .createTextOutput('ENR08-V05 : service actif')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    euromedAuthorizeMail_(e);
    if (!e || !e.parameter) throw new Error('Aucune donnée reçue.');

    const token = PropertiesService.getScriptProperties().getProperty('APP_TOKEN');
    if (token && e.parameter.token !== token) {
      return json_({ok:false, error:'Token invalide'});
    }

    const filename = sanitizeFilename_(e.parameter.filename || 'ENR08-V05.pdf');
    const base64 = e.parameter.pdf_base64 || '';
    if (!base64) throw new Error('PDF manquant.');

    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, 'application/pdf', filename);

    const client = e.parameter.client || '';
    const technicien = e.parameter.technicien || '';
    const date = e.parameter.date || '';
    const reference = e.parameter.reference || '';
    const serie = e.parameter.serie || '';

    const sujet = `Fiche de maintenance lit médicalisé – ENR08-V05${reference ? ' – ' + reference : ''}`;
    const corps = [
      'Bonjour,',
      '',
      'Veuillez trouver ci-joint la fiche de maintenance ENR08-V05.',
      '',
      `Client : ${client}`,
      `Technicien : ${technicien}`,
      `Date : ${date}`,
      `Référence intervention : ${reference}`,
      `N° série / parc : ${serie}`,
      '',
      'Le PDF a été généré automatiquement depuis la fiche en ligne.',
      '',
      'Cordialement,',
      'EuroMed'
    ].join('\n');

    MailApp.sendEmail({
      to: DESTINATAIRE,
      subject: sujet,
      body: corps,
      name: NOM_EXPEDITEUR,
      attachments: [blob]
    });

    euromedLogMailEvent_(e, EUROMED_APP_KEY, 'accepted');
    return json_({ok:true, message:'Fiche envoyée'});
  } catch (err) {
    euromedLogMailEvent_(e, EUROMED_APP_KEY, 'failed', err && err.name ? err.name : 'error');
    console.error(err);
    return json_({ok:false, error:String(err)});
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeFilename_(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'ENR08-V05.pdf';
}

/**
 * EuroMed — vérification serveur avant tout envoi d'e-mail.
 * À copier dans CHAQUE projet Google Apps Script qui appelle MailApp/GmailApp.
 * Ne jamais journaliser ni enregistrer le jeton reçu.
 */
const EUROMED_AUTH_URL = 'https://nrtrraawiqfbajccfmzc.supabase.co';
const EUROMED_AUTH_PUBLIC_KEY = 'sb_publishable_mI8nBWjKRxTgn2b8ppAyoA_BaxQI4zx';
// À personnaliser différemment dans chaque projet Apps Script.
const EUROMED_APP_KEY = 'maintenance-lit';

function euromedAuthorizeMail_(event) {
  const params = {};
  if (event && event.parameter) {
    Object.keys(event.parameter).forEach(function (key) {
      params[key] = event.parameter[key];
    });
  }

  const raw = event && event.postData && event.postData.contents
    ? String(event.postData.contents) : '';
  if (raw) {
    try {
      const object = JSON.parse(raw);
      if (object && typeof object === 'object' && !Array.isArray(object)) {
        Object.keys(object).forEach(function (key) { params[key] = object[key]; });
      }
    } catch (ignore) {
      raw.split('&').forEach(function (part) {
        const index = part.indexOf('=');
        if (index < 0) return;
        const key = decodeURIComponent(part.slice(0, index).replace(/\+/g, ' '));
        const value = decodeURIComponent(part.slice(index + 1).replace(/\+/g, ' '));
        if (!(key in params)) params[key] = value;
      });
    }
  }

  const accessToken = String(params.euromed_access_token || '').trim();
  if (!accessToken) throw new Error('Connexion EuroMed requise pour envoyer un e-mail.');

  const headers = {
    apikey: EUROMED_AUTH_PUBLIC_KEY,
    Authorization: 'Bearer ' + accessToken
  };
  const userResponse = UrlFetchApp.fetch(EUROMED_AUTH_URL + '/auth/v1/user', {
    method: 'get', headers: headers, muteHttpExceptions: true
  });
  if (userResponse.getResponseCode() !== 200) {
    throw new Error('Session EuroMed invalide ou expirée. Reconnectez-vous.');
  }
  const user = JSON.parse(userResponse.getContentText() || '{}');
  if (!user.id || !user.email) throw new Error('Compte EuroMed introuvable.');

  const profileUrl = EUROMED_AUTH_URL + '/rest/v1/euromed_profiles' +
    '?select=approved,role,active,session_revoked_at&id=eq.' + encodeURIComponent(user.id);
  const profileResponse = UrlFetchApp.fetch(profileUrl, {
    method: 'get', headers: headers, muteHttpExceptions: true
  });
  if (profileResponse.getResponseCode() !== 200) {
    throw new Error('Impossible de vérifier l’autorisation EuroMed.');
  }
  const profiles = JSON.parse(profileResponse.getContentText() || '[]');
  if (!profiles.length || profiles[0].approved !== true || profiles[0].active !== true) {
    euromedLogMailEvent_(event, EUROMED_APP_KEY, 'blocked', profiles.length && profiles[0].active === false ? 'account-suspended' : 'account-not-approved');
    throw new Error('Compte EuroMed en attente de validation : envoi refusé.');
  }
  const issuedAt = euromedTokenIssuedAt_(accessToken);
  const revokedAt = profiles[0].session_revoked_at ? Math.floor(new Date(profiles[0].session_revoked_at).getTime() / 1000) : 0;
  if (!issuedAt || (revokedAt && issuedAt <= revokedAt)) {
    euromedLogMailEvent_(event, EUROMED_APP_KEY, 'blocked', 'session-revoked');
    throw new Error('Session révoquée. Reconnectez-vous avec votre nouveau lien d’accès.');
  }

  const policyResponse = UrlFetchApp.fetch(EUROMED_AUTH_URL + '/rest/v1/rpc/euromed_get_mail_policy', {
    method: 'post', headers: headers, contentType: 'application/json', payload: '{}', muteHttpExceptions: true
  });
  if (policyResponse.getResponseCode() !== 200 || policyResponse.getContentText() !== 'true') {
    euromedLogMailEvent_(event, EUROMED_APP_KEY, 'blocked', 'mail-paused');
    throw new Error('Les envois e-mail sont temporairement suspendus par l’administrateur EuroMed.');
  }
  return { id: user.id, email: user.email, role: profiles[0].role };
}

function euromedTokenIssuedAt_(token) {
  try {
    const part = String(token).split('.')[1];
    if (!part) return 0;
    const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(part)).getDataAsString();
    return Number(JSON.parse(decoded).iat || 0);
  } catch (ignore) { return 0; }
}

/**
 * Ajoute un événement minimal au suivi administrateur (sans destinataire ni contenu).
 * Appeler après l'envoi MailApp réussi, puis dans catch en cas d'échec.
 */
function euromedLogMailEvent_(event, appKey, status, errorCode) {
  try {
    const params = {};
    if (event && event.parameter) Object.keys(event.parameter).forEach(function (key) { params[key] = event.parameter[key]; });
    const raw = event && event.postData && event.postData.contents ? String(event.postData.contents) : '';
    if (raw) {
      try { Object.assign(params, JSON.parse(raw)); } catch (ignore) {
        raw.split('&').forEach(function (part) {
          const i = part.indexOf('='); if (i < 0) return;
          params[decodeURIComponent(part.slice(0, i).replace(/\+/g, ' '))] = decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' '));
        });
      }
    }
    const token = String(params.euromed_access_token || '').trim();
    if (!token) return;
    UrlFetchApp.fetch(EUROMED_AUTH_URL + '/rest/v1/rpc/euromed_log_mail_event', {
      method: 'post',
      headers: { apikey: EUROMED_AUTH_PUBLIC_KEY, Authorization: 'Bearer ' + token },
      contentType: 'application/json',
      payload: JSON.stringify({ p_app_key: String(appKey || 'inconnu').slice(0, 80), p_status: status, p_error_code: status === 'failed' ? String(errorCode || 'erreur').slice(0, 80) : null }),
      muteHttpExceptions: true
    });
  } catch (ignore) { /* Les journaux ne doivent jamais empêcher un envoi ou son traitement. */ }
}

