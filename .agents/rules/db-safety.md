# Reglas de Protección de Datos de Temarios y Criterios Técnicos

## 1. Integridad de Temarios y Aspectos en Base de Datos (Source of Truth)
- **NUNCA** sobreescribir, borrar, truncar ni resetear temarios (`ExamSyllabi`), técnicas ni aspectos técnicos (`technicalAspects`) que hayan sido configurados y guardados por el usuario en MongoDB.
- Los datos almacenados en MongoDB son la **única fuente de verdad**. Las constantes (`DEFAULT_TECHNICAL_ASPECTS`) son únicamente plantillas de inicialización para nuevos dojos/temarios en blanco, jamás para sobreescribir datos existentes.

## 2. Incorporación de Criterios Nuevos o Traducciones
- Si el usuario suministra nuevos criterios, listas o sugerencias (por ejemplo, criterios de Kata o Kumite traducidos), **NUNCA** sobreescribir automáticamente los criterios existentes.
- Antes de aplicar cambios masivos en temarios, **SIEMPRE preguntar al usuario**:
  - ¿Desea agregarlos al final de los criterios ya existentes?
  - ¿Desea crear un nuevo bloque/categoría?
  - ¿O desea reemplazar específicamente los anteriores?

## 3. Código Frontend y Backend
- Ninguna función (como `mergeAspectsWithDefaults`) debe forzar el reemplazo de arrays de `points` existentes. Si el aspecto ya existe en la base de datos, sus puntos deben preservarse intactos.
