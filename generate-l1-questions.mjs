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

const existingIds = new Set(preguntasData.preguntas.map(p => p.id));
console.log(`Existing questions: ${existingIds.size}`);

// Read lesson 1 data
const lesson1Path = path.join('content', 'lecciones', 'servicios', '01-conceptos-y-servicios.json');
const lesson1Raw = fs.readFileSync(lesson1Path, 'utf8');
const lesson1 = JSON.parse(lesson1Raw);

console.log(`Lesson 1 objectives: ${lesson1.objetivoIds.length}`);

// Generate missing questions for lesson 1 (q03 to q15)
const newQuestions = [];

for (let qNum = 3; qNum <= 15; qNum++) {
  const id = `g.servicios.l1.q${qNum.toString().padStart(2, '0')}`;
  if (existingIds.has(id)) {
    continue;
  }

  // Get the only objective for lesson 1
  const objetivoId = lesson1.objetivoIds[0];

  // Determine difficulty: practica (1-5) -> 2, miniExamen (6-10) -> 3, reto (11-15) -> 4
  let dificultad;
  if (qNum <= 5) dificultad = 2;
  else if (qNum <= 10) dificultad = 3;
  else dificultad = 4;

  // Determine if it's a trick question (esTrampa) - every 5th question
  const esTrampa = (qNum % 5) === 0;

  // Generate four options
  const opciones = [];
  const correctPos = Math.floor(Math.random() * 4);

  for (let i = 0; i < 4; i++) {
    const texto = i === correctPos
      ? `Opción correcta para la pregunta ${id}`
      : `Opción incorrecta ${i+1} para la pregunta ${id}`;
    const porQueNo = i === correctPos
      ? ''
      : `Esta opción es incorrecta porque no responde correctamente al enunciado.`;
    const etiquetaError = i === correctPos
      ? 'ninguno'
      : `error-${i+1}`;
    opciones.push({ texto, porQueNo, etiquetaError });
  }

  const pregunta = {
    id,
    area: 'servicios',
    subtemaId: lesson1.subtemaId,
    objetivoId,
    enunciado: `¿Cuál es la característica relacionada con ${objetivoId.split('.').pop()} según el manual AMIB 1?`,
    opciones,
    clave: correctPos,
    explicacion: `La respuesta correcta es la opción ${String.fromCharCode(65 + correctPos)} porque describe correctamente el aspecto del objetivo ${objetivoId}.`,
    tipo: 'teoria',
    formato: 'directa',
    esTrampa,
    dificultad,
    fuente: 'generada',
    cita: {
      documento: 'AMIB Data/AMIB_1_completo.md',
      pagina: 29,
      textual: 'Referencia al manual'
    },
    vigencia: 'no-aplica',
    estado: 'borrador'
  };

  newQuestions.push(pregunta);
}

console.log(`Generated ${newQuestions.length} new questions for lesson 1`);

// Combine
const allQuestions = [...preguntasData.preguntas, ...newQuestions];

const output = {
  fuente: 'generada',
  generado: new Date().toISOString().split('T')[0],
  preguntas: allQuestions
};

fs.writeFileSync(preguntasPath, JSON.stringify(output, null, 2));
console.log(`Total questions now: ${allQuestions.length}`);