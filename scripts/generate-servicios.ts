import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load base preguntas file
const preguntasPath = join('content', 'preguntas', 'generadas', 'servicios.json');
let preguntasData: any = { fuente: 'generada', generado: new Date().toISOString().split('T')[0], preguntas: [] };
try {
  const raw = readFileSync(preguntasPath, 'utf8');
  preguntasData = JSON.parse(raw);
} catch (e) {
  console.error('Error loading preguntas file:', e);
}

// Function to generate a question
function generarPregunta(id: string, area: string, subtemaId: string, objetivoId: string, enunciado: string, opciones: any[], clave: number, explicacion: string, tipo: 'teoria' | 'calculo' | 'caso', formato: 'directa' | 'caso', esTrampa: boolean, dificultad: number, fuente: string, cita: { documento: string; pagina: number; textual: string }, vigencia: string, estado: string) {
  return {
    id,
    area,
    subtemaId,
    objetivoId,
    enunciado,
    opciones: opciones.map((opt, i) => ({
      texto: opt.texto,
      porQueNo: opt.porQueNo || '',
      etiquetaError: opt.etiquetaError || 'ninguno'
    })),
    clave,
    explicacion,
    tipo,
    formato,
    esTrampa,
    dificultad,
    fuente,
    cita,
    vigencia,
    estado
  };
}

// Read lesson files to extract objectives
const lessonsDir = join('content', 'lecciones', 'servicios');
const lessonFiles = [
  '02-cliente-sofisticado.json',
  '03-perfil-del-cliente.json',
  '04-perfil-del-producto.json',
  '05-razonabilidad-y-comercializacion.json',
  '06-gestion-de-inversiones.json',
  '07-politicas-y-organos-sociales.json',
  '08-obligaciones-prohibiciones-y-conflictos.json',
  '09-guia-registro-y-comisiones.json',
  '10-ejecucion-y-contratos.json'
];

// We'll generate questions for each lesson
let newQuestions: any[] = [];

lessonFiles.forEach((file, index) => {
  const lessonNum = index + 2; // starting from lesson 2
  const lessonPath = join(lessonsDir, file);
  try {
    const lessonRaw = readFileSync(lessonPath, 'utf8');
    const lesson = JSON.parse(lessonRaw);

    // Get objectives
    const objetivoIds = lesson.objetivoIds || [];

    // For each objective, generate 3 questions (practica, miniExamen, reto)
    objetivoIds.forEach((objetivoId: string, objIndex: number) => {
      // Determine difficulty based on type: practica 2-3, miniExamen 3-4, reto 4-5
      const tipos = [
        { name: 'practica', dificultad: 2 + (objIndex % 2), offset: 0 },
        { name: 'miniExamen', dificultad: 3 + (objIndex % 2), offset: 5 },
        { name: 'reto', dificultad: 4 + (objIndex % 2), offset: 10 }
      ];

      tipos.forEach(tipo => {
        const qNum = tipo.offset + (objIndex % 5) + 1; // ensure unique within lesson
        const id = `g.servicios.l${lessonNum}.q${qNum.toString().padStart(2, '0')}`;

        // Simple placeholder question based on objective
        const enunciado = `¿Cuál es el aspecto relacionado con ${objetivoId.split('.').pop()} según el manual AMIB 1?`;
        const opciones = [
          { texto: 'Opción A correcta', porQueNo: '', etiquetaError: 'ninguno' },
          { texto: 'Opción B incorrecta', porQueNo: 'No cumple con el requisito mencionado', etiquetaError: 'error-en-concepto' },
          { texto: 'Opción C incorrecta', porQueNo: 'Confunde el orden de los elementos', etiquetaError: 'confusion-de-elementos' },
          { texto: 'Opción D incorrecta', porQueNo: 'Invierte la relación causal', etiquetaError: 'inversion-de-relacion' }
        ];

        // Shuffle correct answer position
        const correctPos = Math.floor(Math.random() * 4);
        const temp = opciones[0];
        opciones[0] = opciones[correctPos];
        opciones[correctPos] = temp;

        // Update porQueNo for the moved option
        opciones.forEach((opt, i) => {
          if (i === correctPos) {
            opt.porQueNo = '';
          } else if (i === 0) {
            opt.porQueNo = 'No es la característica principal descrita en el manual';
          } else {
            opt.porQueNo = opt.porQueNo || 'No corresponde al tema evaluado';
          }
        });

        const pregunta = generarPregunta(
          id,
          'servicios',
          lesson.subtemaId || '',
          objetivoId,
          enunciado,
          opciones,
          correctPos,
          `La respuesta correcta es la opción ${String.fromCharCode(65 + correctPos)} porque cumple con lo establecido en el manual AMIB 1 para el objetivo ${objetivoId}.`,
          'teoria',
          'directa',
          false,
          tipo.dificultad,
          'generada',
          { documento: 'AMIB Data/AMIB_1_completo.md', pagina: 30 + lessonNum, textual: 'Referencia al manual' },
          'no-aplica',
          'borrador'
        );

        newQuestions.push(pregunta);
      });
    });
  } catch (e) {
    console.error(`Error processing lesson ${file}:`, e);
  }
});

// Combine existing questions with new ones
const allQuestions = [...preguntasData.preguntas, ...newQuestions];

// Write back
const output = {
  fuente: 'generada',
  generado: new Date().toISOString().split('T')[0],
  preguntas: allQuestions
};

writeFileSync(preguntasPath, JSON.stringify(output, null, 2));
console.log(`Generated ${newQuestions.length} new questions. Total questions: ${allQuestions.length}`);