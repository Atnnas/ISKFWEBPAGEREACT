# Directivas del Proyecto ISKF Costa Rica

## 🥋 Filosofía de Evaluación: Comentarios 100% Correctivos
1. **Carácter Estrictamente Técnico y Correctivo**:
   - Todo comentario, observación técnica por técnica, nota de fase y síntesis consolidada del tribunal evaluador debe ser **100% correctivo**.
   - Queda terminantemente **PROHIBIDO** incluir comentarios de felicitación, complacencia o adulación (por ejemplo: "excelente presentación", "actitud ejemplar", "sobresaliente desempeño", "gran espíritu", "felicidades").
   - La evaluación marcial en Karate Shotokan ISKF tiene como único fin señalar al aspirante los puntos biomecánicos, posturales y de foco que debe corregir para pulir su técnica hacia su siguiente grado.
2. **Prompts e Inteligencia Artificial**:
   - Todo prompt o motor de síntesis (Gemini, OpenAI, reglas expertas) debe generar viñetas correctivas directas sin flores ni halagos.

## 📝 Examen Escrito: Exención de 10° Kyu a 5° Kyu
- De **10° Kyu a 5° Kyu**, la casilla del examen escrito aparece con un guion (`"-"`) y se omite estrictamente del cálculo del promedio final oficial (el promedio se calcula únicamente con Kihon, Kata y Kumite).

## 🛡️ Protección Absoluta de Datos de Temarios y Criterios
1. **Inmutabilidad de lo guardado en MongoDB**:
   - Todo temario (`ExamSyllabi`), técnica y criterio técnico (`technicalAspects`) guardado por el usuario en la base de datos es la **fuente definitiva de verdad**.
   - Queda terminantemente **PROHIBIDO** sobreescribir, borrar, reemplazar o resetear criterios existentes con valores por defecto o constantes de fábrica.
2. **Modificación de criterios bajo consulta explícita**:
   - Si el usuario comparte nuevos criterios, traducciones o rúbricas adicionales, **NUNCA** reemplaces los existentes automáticamente.
   - Pregunta siempre si desea: (a) sumarlos al final como criterios extra, (b) crear una nueva categoría, o (c) reemplazar únicamente si lo pide de forma explícita.
3. **Sincronización Código-Base de Datos**:
   - El código en `ExamSyllabiView.jsx`, `TechnicalExamsView.jsx` y `TechnicalExamEvaluatorCore.jsx` debe siempre leer y respetar los criterios que vengan de la base de datos sin alterarlos.
