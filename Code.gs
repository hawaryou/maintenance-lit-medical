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

    return json_({ok:true, message:'Fiche envoyée'});
  } catch (err) {
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
