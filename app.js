const sections = [
 {title:"POTENCE", items:[
  "Potence (fixation, sangle, enrouleur …)"
 ]},
 {title:"BARRIÈRES", items:[
  "Espacement entre la tête du lit et la barrière (< 60 mm)*",
  "Espacement entre 1/2 barrières (< 60 ou > 318 mm)*",
  "État, sens de montage, adaptation au lit …",
  "Fixation des barrières et verrouillage en position haute (fermée)"
 ]},
 {title:"CONTRÔLE VISUEL", items:[
  "Identification - étiquetage",
  "Propreté générale / aspect extérieur (vérin, capot de protection, …)",
  "État de fixation des panneaux tête et pieds",
  "Plan de couchage (sommier)",
  "Serrages des boulonneries, axes et fixation des goupilles",
  "Corrosion, soudures / humidité"
 ]},
 {title:"CONTRÔLE FONCTIONNEL", items:[
  "Parties mobiles (hauteur variable, relève buste, relève jambes, proclive, déclive …)",
  "Télécommande (boutons, voyants, système de verrouillage)",
  "Roues (pivotement, roulage …)",
  "Freins (blocage)",
  "Absence de nuisances sonores (grincements)"
 ]},
 {title:"CONTRÔLE ÉLECTRIQUE", items:[
  "État des câbles électriques des prises et des connecteurs",
  "État des équipements électriques (bloc d'alimentation, vérins …)"
 ]}
];

const checks=document.getElementById("checks");
sections.forEach((s,si)=>{
  const title=document.createElement("div"); title.className="section-title"; title.textContent=s.title; checks.appendChild(title);
  s.items.forEach((item,i)=>{
    const row=document.createElement("div"); row.className="check-row";
    row.innerHTML=`<label>${item}</label><select name="check_${si}_${i}"><option value="">Choisir…</option><option>Non applicable</option><option>Conforme</option><option>Non conforme</option></select>`;
    checks.appendChild(row);
  });
});

document.querySelector('input[name="date"]').valueAsDate=new Date();

function setupSignature(id){
 const c=document.getElementById(id), ctx=c.getContext("2d"); let drawing=false;
 const pos=e=>{const r=c.getBoundingClientRect(), t=e.touches?.[0]; return {x:((t?.clientX??e.clientX)-r.left)*(c.width/r.width),y:((t?.clientY??e.clientY)-r.top)*(c.height/r.height)}};
 const start=e=>{drawing=true; const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()};
 const move=e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()};
 const end=()=>drawing=false;
 ctx.lineWidth=3;ctx.lineCap="round";ctx.strokeStyle="#111827";
 c.addEventListener("mousedown",start);c.addEventListener("mousemove",move);c.addEventListener("mouseup",end);c.addEventListener("mouseleave",end);
 c.addEventListener("touchstart",start,{passive:false});c.addEventListener("touchmove",move,{passive:false});c.addEventListener("touchend",end);
}
setupSignature("sigTech");setupSignature("sigClient");
document.querySelectorAll("[data-clear]").forEach(b=>b.onclick=()=>{const c=document.getElementById(b.dataset.clear);c.getContext("2d").clearRect(0,0,c.width,c.height)});

function data(){
 const f=new FormData(document.getElementById("maintenanceForm")); const o={};
 for(const [k,v] of f.entries())o[k]=v;
 o.essai62353=document.querySelector('[name="essai62353"]').checked;
 o.sigTech=document.getElementById("sigTech").toDataURL("image/png");
 o.sigClient=document.getElementById("sigClient").toDataURL("image/png");
 o.checks=sections.flatMap((s,si)=>s.items.map((item,i)=>({section:s.title,item,value:o[`check_${si}_${i}`]||""})));
 return o;
}

function buildPdf(){
 const {jsPDF}=window.jspdf; const d=new jsPDF({unit:"mm",format:"a4"});
 const x=14; let y=15;
 const o=data();
 d.setFont("helvetica","bold");d.setFontSize(9);d.text("ENR08-V05",x,y);
 d.setFontSize(17);d.setTextColor(22,78,112);d.text("FICHE DE MAINTENANCE LIT MÉDICALISÉ",x,y+10);
 d.setFontSize(9);d.setTextColor(80);d.text("Euromed – formulaire numérique",x,y+16);
 y+=23;
 d.setTextColor(30);d.setFontSize(10);
 const info=[
 ["Maintenance",o.maintenance],["Marque / modèle",o.modele],["Année de fabrication",o.annee],
 ["N° série / parc",o.serie],["Barrières",o.barrieres],["N° série barrières",o.serie_barrieres],
 ["Potence",o.potence],["N° série potence",o.serie_potence],["Environnement",o.environnement],["Localisation",o.localisation]
 ];
 d.autoTable({startY:y,head:[["IDENTIFICATION","VALEUR"]],body:info,theme:"grid",styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[22,78,112]}});
 y=d.lastAutoTable.finalY+6;
 const body=o.checks.map(c=>[c.section,c.item,c.value]);
 d.autoTable({startY:y,head:[["SECTION","POINT DE CONTRÔLE","RÉSULTAT"]],body,theme:"grid",styles:{fontSize:7,cellPadding:1.8},headStyles:{fillColor:[22,78,112]},columnStyles:{0:{cellWidth:32},1:{cellWidth:112},2:{cellWidth:38}}});
 y=d.lastAutoTable.finalY+6;
 d.autoTable({startY:y,head:[["ESSAI ÉLECTRIQUE","RÉSULTAT"]],body:[["NF EN 62353",o.essai62353?"Réalisé":"Non renseigné"]],theme:"grid",styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[22,78,112]}});
 y=d.lastAutoTable.finalY+6;
 const obs=[["Observations",o.observations||""],["Pièces changées",o.pieces||""],["Consignes de sécurité",o.securite||""],["Fait le",o.date||""],["Technicien",o.technicien||""],["Client",o.client||""]];
 d.autoTable({startY:y,head:[["FINALISATION","VALEUR"]],body:obs,theme:"grid",styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[22,78,112]}});
 y=d.lastAutoTable.finalY+5;
 d.setFontSize(8);d.text("Signature technicien",x,y);d.text("Signature client",105,y);
 d.addImage(o.sigTech,"PNG",x,y+2,75,27);d.addImage(o.sigClient,"PNG",105,y+2,75,27);
 d.setFontSize(7);d.setTextColor(100);d.text("* suivant norme NF EN 60601-2-52",x,286);
 return d;
}

document.getElementById("previewBtn").onclick=()=>buildPdf().save("Fiche_maintenance_lit_medicalise.pdf");

document.getElementById("sendBtn").onclick=async()=>{
 const form=document.getElementById("maintenanceForm"); const status=document.getElementById("status");
 if(!form.reportValidity()) return;
 status.className="status";status.textContent="Génération du PDF…";
 try{
  /* CONFIGURATION EMAILJS :
     Remplacez les 3 valeurs ci-dessous après création du service/template sur EmailJS.
     Le destinataire final est défini dans le template EmailJS.
  */
  const EMAILJS_PUBLIC_KEY="VOTRE_PUBLIC_KEY";
  const EMAILJS_SERVICE_ID="VOTRE_SERVICE_ID";
  const EMAILJS_TEMPLATE_ID="VOTRE_TEMPLATE_ID";
  if(EMAILJS_PUBLIC_KEY.startsWith("VOTRE_")) throw new Error("EmailJS n'est pas encore configuré.");
  const pdf=buildPdf(); const blob=pdf.output("blob"); const base64=pdf.output("datauristring");
  emailjs.init({publicKey:EMAILJS_PUBLIC_KEY});
  const o=data();
  await emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{
    maintenance:o.maintenance,modele:o.modele,serie:o.serie,technicien:o.technicien,client:o.client,date:o.date,
    attachment:base64,
    filename:"Fiche_maintenance_lit_medicalise.pdf"
  });
  status.className="status success";status.textContent="PDF généré et envoyé par e-mail.";
 }catch(e){console.error(e);status.className="status error";status.textContent="Envoi impossible : "+e.message;}
};
