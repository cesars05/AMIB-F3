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

// We'll generate for lessons 2 to 10
const totalLessons = 10; // lessons 1 through 10
const questionsPerLesson = 15;

// We need to get lesson data to extract subtemaId and objectiveIds
const leccionesDir = path.join('content', 'lecciones', 'servicios');
const lessons = [];

for (let lessonNum = 1; lessonNum <= 10; lessonNum++) {
  const fileName = lessonNum.toString().padStart(2, '0') + '-' +
    (lessonNum === 2 ? 'cliente-sofisticado' :
     lessonNum === 3 ? 'perfil-del-cliente' :
     lessonNum === 4 ? 'perfil-del-producto' :
     lessonNum === 5 ? 'razonabilidad-y-comercializacion' :
     lessonNum === 6 ? 'gestion-de-inversiones' :
     lessonNum === 7 ? 'politicas-y-organos-sociales' :
     lessonNum === 8 ? 'obligaciones-prohibiciones-y-conflictos' :
     lessonNum === 9 ? 'guia-registro-y-comisiones' :
     lessonNum === 10 ? 'ejecucion-y-contratos' : '') + '.json';
  const lessonPath = path.join(leccionesDir, fileName);
  try {
    const raw = fs.readFileSync(lessonPath, 'utf8');
    const lessonData = JSON.parse(raw);
    lessons.push({
      num: lessonNum,
      file: fileName,
      subtemaId: lessonData.subtemaId || '',
      objetivoIds: lessonData.objetivoIds || []
    });
    console.log(`Lesson ${lessonNum}: ${lessonData.objetivoIds.length} objectives`);
  } catch (e) {
    console.error(`Error reading lesson ${fileName}:`, e.message);
    // If we can't read, we'll still create questions with empty subtemaId and objectiveIds
    lessons.push({
      num: lessonNum,
      file: fileName,
      subtemaId: '',
      objetivoIds: []
    });
  }
}

// Generate missing questions
const newQuestions = [];

lessons.forEach(lesson => {
  // We'll distribute questions across objectives if there are multiple
  const objCount = lesson.objetivoIds.length;
  for (let qNum = 1; qNum <= questionsPerLesson; qNum++) {
    const id = `g.servicios.l${lesson.num}.q${qNum.toString().padStart(2, '0')}`;
    if (existingIds.has(id)) {
      // skip existing
      continue;
    }
    // Determine which objective to use (cycle through objectives)
    const objetivoId = lesson.objetivoIds.length > 0
      ? lesson.objetivoIds[qNum % lesson.objetivoIds.length]
      : '';

    // Determine difficulty: practica (1-5) -> 2, miniExamen (6-10) -> 3, reto (11-15) -> 4
    let dificultad;
    if (qNum <= 5) dificultad = 2;
    else if (qNum <= 10) dificultad = 3;
    else dificultad = 4;
    // Ensure between 1 and 5
    if (dificultad < 1) dificultad = 1;
    if (dificultad > 5) dificultad = 5;

    // Determine if it's a trick question (esTrampa) - we'll make 20% trick
    const esTrampa = (qNum % 5) === 0; // every 5th question is trick

    // Generate four options
    const opciones = [];
    const correctPos = Math.floor(Math.random() * 4); // 0-3

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

    // Shuffle options to randomize correct position (we already set correctPos, but we'll keep it)
    // Actually we want to keep the correctPos we chose, so we don't shuffle after.

    const pregunta = {
      id,
      area: 'servicios',
      subtemaId: lesson.subtemaId,
      objetivoId,
      enunciado: `¿Cuál es la característica relacionada con el objetivo ${objetivoId.split('.').pop()} según el manual AMIB 1?`,
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
        pagina: 30 + lesson.num, // placeholder
        textual: 'Referencia al manual'
      },
      vigencia: 'no-aplica',
      estado: 'borrador'
    };

    newQuestions.push(pregunta);
  }
});

console.log(`Generated ${newQuestions.length} new questions`);

// Combine
const allQuestions = [...preguntasData.preguntas, ...newQuestions];

const output = {
  fuente: 'generada',
  generado: new Date().toISOString().split('T')[0],
  preguntas: allQuestions
};

fs.writeFileSync(preguntasPath, JSON.stringify(output, null, 2));
console.log(`Total questions now: ${allQuestions.length}`);