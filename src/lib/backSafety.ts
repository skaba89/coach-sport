// Back-safety gate. This app is a fitness app, not a medical device: it
// never diagnoses anything. It only checks for red-flag symptoms that
// warrant seeing a doctor before doing any exercise at all, and blocks
// auto-starting a "Dos" session when any is present.

export interface RedFlagQuestion {
  id: string
  label: string
}

export const backRedFlagQuestions: RedFlagQuestion[] = [
  { id: 'bladder', label: 'Perte ou modification récente du contrôle de la vessie' },
  { id: 'bowel', label: 'Perte ou modification récente du contrôle intestinal' },
  { id: 'saddle-numbness', label: 'Engourdissement autour des organes génitaux ou de l\'anus' },
  { id: 'leg-weakness', label: 'Faiblesse importante et inhabituelle des jambes' },
  { id: 'leg-numbness', label: 'Engourdissement important des deux jambes' },
  { id: 'walking', label: 'Difficulté nouvelle à marcher' },
  { id: 'trauma', label: 'Traumatisme important récent (chute, accident...)' },
  { id: 'fever', label: 'Douleur accompagnée de fièvre ou d\'un état général très altéré' },
  { id: 'sudden-severe', label: 'Douleur très intense apparue brutalement' },
  { id: 'worsening', label: 'Symptômes qui s\'aggravent rapidement' },
]

export const backSafetyMedicalMessage =
  'Ces signes peuvent nécessiter un avis médical rapide. Cette application ne pose pas de diagnostic — consulte un professionnel de santé avant de reprendre une activité physique concernant le dos.'
