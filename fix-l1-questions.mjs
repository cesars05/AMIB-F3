import fs from 'fs';
import path from 'path';

const preguntasPath = path.join('content', 'preguntas', 'generadas', 'servicios.json');
let preguntasData;
try {
  const raw = fs.readFileSync(preguntasPath, 'utf8');
  preguntasData = JSON.parse(raw);
} catch (e) {
  console.error('Error loading preguntas file:', e);
  process.exit(1);
}

// Read lesson 1 data
const lesson1Path = path.join('content', 'lecciones', 'servicios', '01-conceptos-y-servicios.json');
const lesson1Raw = fs.readFileSync(lesson1Path, 'utf8');
const lesson1 = JSON.parse(lesson1Raw);

const subtemaId = lesson1.subtemaId;
const objetivoId = lesson1.objetivoIds[0];

// Fix lesson 1 questions
let fixedCount = 0;
for (let i = 0; i < preguntasData.preguntas.length; i++) {
  const p = preguntasData.preguntas[i];
  if (p.id.startsWith('g.servicios.l1.') && p.id !== 'g.servicios.l1.q01' && p.id !== 'g.servicios.l1.q02') {
    if (p.subtemaId === '' || p.objetivoId === '') {
      p.subtemaId = subtemaId;
      p.objetivoId = objetivoId;
      fixedCount++;
    }
  }
}

console.log(`Fixed ${fixedCount} lesson 1 questions`);

// Save
const output = {
  fuente: 'generada',
  generado: new Date().toISOString().split('T')[0],
  preguntas: preguntasData.preguntas
};

fs.writeFileSync(preguntasPath, JSON.stringify(output, null, 2));
console.log('Done!');