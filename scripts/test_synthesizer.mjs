import { synthesizePhaseBulletsWithAI } from '../src/lib/utils/martialAiSynthesizer.js';

const kihonNotes = [
  {
    evaluatorName: 'Sensei Roy Gatjens',
    note: '• Debe evitar abrir la punta del pie antes de abrir.\n• Se acomoda mucho el cabello, debe evitar hacerlo.\n• No cierra los codos cuando carga el gedan barai para cubrirse el pecho.'
  },
  {
    evaluatorName: 'Sensei Andrea Maroto',
    note: '• Se nota que hace un movimiento previo, con la punta del pie antes de salir.\n• Se distrae mucho acomodandose el cabello.\n• No hace snap con la punta del pie.'
  }
];

const kataNotes = [
  {
    evaluatorName: 'Sensei Roy Gatjens',
    note: '• No dirige la mirada donde debe ir.'
  }
];

const kumiteNotes = [
  {
    evaluatorName: 'Sensei Roy Gatjens',
    note: '• Respiracion inadecuada.'
  }
];

console.log('=== KIHON SINTETIZADO ===');
synthesizePhaseBulletsWithAI({ phase: 'kihon', notesList: kihonNotes, phaseAverage: 76 }).forEach((b, i) => {
  console.log(`${i+1}. ${b.text}`);
  console.log(`   [Coincidencia: ${b.coincidenceCount} evaluador(es) -> ${b.evaluators.join(', ')}]`);
});

console.log('\n=== KATA SINTETIZADO ===');
synthesizePhaseBulletsWithAI({ phase: 'kata', notesList: kataNotes, phaseAverage: 76 }).forEach((b, i) => {
  console.log(`${i+1}. ${b.text}`);
  console.log(`   [Coincidencia: ${b.coincidenceCount} evaluador(es) -> ${b.evaluators.join(', ')}]`);
});

console.log('\n=== KUMITE SINTETIZADO ===');
synthesizePhaseBulletsWithAI({ phase: 'kumite', notesList: kumiteNotes, phaseAverage: 74 }).forEach((b, i) => {
  console.log(`${i+1}. ${b.text}`);
  console.log(`   [Coincidencia: ${b.coincidenceCount} evaluador(es) -> ${b.evaluators.join(', ')}]`);
});
