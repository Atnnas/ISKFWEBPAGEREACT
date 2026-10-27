# Directivas del Proyecto ISKF Costa Rica

## 🛡️ Protección Absoluta de Datos de Temarios y Criterios
1. **Inmutabilidad de lo guardado en MongoDB**:
   - Todo temario (`ExamSyllabi`), técnica y criterio técnico (`technicalAspects`) guardado por el usuario en la base de datos es la **fuente definitiva de verdad**.
   - Queda terminantemente **PROHIBIDO** sobreescribir, borrar, reemplazar o resetear criterios existentes con valores por defecto o constantes de fábrica.
2. **Modificación de criterios bajo consulta explícita**:
   - Si el usuario comparte nuevos criterios, traducciones o rúbricas adicionales, **NUNCA** reemplaces los existentes automáticamente.
   - Pregunta siempre si desea: (a) sumarlos al final como criterios extra, (b) crear una nueva categoría, o (c) reemplazar únicamente si lo pide de forma explícita.
3. **Sincronización Código-Base de Datos**:
   - El código en `ExamSyllabiView.jsx`, `TechnicalExamsView.jsx` y `TechnicalExamEvaluatorCore.jsx` debe siempre leer y respetar los criterios que vengan de la base de datos sin alterarlos.
