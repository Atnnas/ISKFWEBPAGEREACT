'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dbConnect from '../mongodb';
import ExamSyllabus from '../../models/ExamSyllabus';
import TechnicalExamCall from '../../models/TechnicalExamCall';
import { auth } from '../../auth';

import { DEFAULT_TECHNICAL_ASPECTS } from '../constants/technicalAspects';
import { isSameRank, KYU_DEFINITIONS, normalizeRankKey } from '../constants/kyuRanks';

/**
 * Sincroniza automáticamente los syllabusSnapshots en cualquier convocatoria activa (no cerrada)
 * cuando se modifica un temario o sus aspectos técnicos.
 */
async function syncOpenCallsSnapshots(syllabusDoc) {
  if (!syllabusDoc) return;
  try {
    const syllabusIdStr = String(syllabusDoc._id);
    const activeCalls = await TechnicalExamCall.find({ status: { $ne: 'cerrado' } });

    for (const call of activeCalls) {
      let modified = false;
      const snaps = Array.isArray(call.syllabusSnapshots) ? [...call.syllabusSnapshots] : [];

      const updatedSnaps = snaps.map(snap => {
        const matchesId = String(snap.syllabusId) === syllabusIdStr;
        const matchesRank =
          isSameRank(snap.targetRank, syllabusDoc.targetRank) ||
          isSameRank(snap.targetRank, syllabusDoc.currentRank);

        if (matchesId || matchesRank) {
          modified = true;
          return {
            syllabusId: syllabusIdStr,
            targetRank: syllabusDoc.targetRank,
            name: syllabusDoc.name,
            techniques: syllabusDoc.techniques || [],
            technicalAspects: syllabusDoc.technicalAspects || [],
            version: syllabusDoc.version || 1
          };
        }
        return snap;
      });

      if (modified) {
        call.syllabusSnapshots = updatedSnaps;
        await call.save();
      }
    }
  } catch (err) {
    console.warn('No se pudo sincronizar snapshots en convocatorias abiertas:', err);
  }
}

/**
 * Sanitizar texto eliminando etiquetas HTML, caracteres de control no imprimibles
 * y limitando longitud para prevenir ataques XSS, inyección y saturación de BSON.
 */
function sanitizeString(val, maxLen = 300) {
  if (typeof val !== 'string') return '';
  const withoutHtml = val.replace(/<[^>]*>/g, '').trim();
  let cleaned = '';
  for (let i = 0; i < withoutHtml.length; i++) {
    const code = withoutHtml.charCodeAt(i);
    // Preservar caracteres legibles estándar y saltos de línea (código >= 32 o 10/13)
    if (code >= 32 || code === 10 || code === 13) {
      cleaned += withoutHtml[i];
    }
  }
  return cleaned.substring(0, maxLen);
}

/**
 * Temarios iniciales por defecto basados en la normativa oficial ISKF Costa Rica
 */
const DEFAULT_INITIAL_SYLLABI = [
  {
    name: 'Temario Oficial: Cinturón Blanco (Examen de 10 Kyu a 9 Kyu)',
    currentRank: '10° Kyu (Cinta Blanca)',
    targetRank: '9° Kyu (Cinta Amarilla)',
    targetRanks: ['10° Kyu (Cinta Blanca)', '9° Kyu (Cinta Amarilla)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Blanco (Examen de 10 Kyu a 9 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: DEFAULT_TECHNICAL_ASPECTS,
    techniques: [
      // 1. KIHON
      {
        id: 'tech-10-9-k1',
        group: 'kihon',
        name: 'Chudan Oi zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k2',
        group: 'kihon',
        name: 'Jodan Age Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k3',
        group: 'kihon',
        name: 'Chudan Soto Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 3,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k4',
        group: 'kihon',
        name: 'Gedan Barai',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k5',
        group: 'kihon',
        name: 'Chudan Shuto Uke',
        stance: 'Kokutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-10-9-k6',
        group: 'kihon',
        name: 'Mae Geri Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      // 2. YAKUSOKU-KUMITE
      {
        id: 'tech-10-9-ku1',
        group: 'kumite',
        name: 'Gohon Kumite (Jodan Zuki)',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Atrás',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku-Kumite: Gohon Kumite (Jodan Zuki).'
      },
      // 3. KATA
      {
        id: 'tech-10-9-ka1',
        group: 'kata',
        name: 'Heian Shodan (Ordenes)',
        stance: 'Zenkutsu / Kokutsu Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Heian Shodan (Ordenes).'
      }
    ]
  },
  {
    name: 'Temario Oficial: Cinturón Amarillo (Examen de 9 Kyu a 8 Kyu)',
    currentRank: '9° Kyu (Cinta Amarilla)',
    targetRank: '8° Kyu (Cinta Naranja)',
    targetRanks: ['9° Kyu (Cinta Amarilla)', '8° Kyu (Cinta Naranja)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Amarillo (Examen de 9 Kyu a 8 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Enfoque, punto focal y trayectoria',
        points: [
          'Golpes dirigidos la zona específica enfocada en un punto particular.',
          'Brazos de Hikite, con puño en la cadera sobre el cinturón.',
          'Tronco recto, hombros hacia abajo, vista al frente al horizonte.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Mecánica de codo y cobertura',
        points: [
          'Mecánica de la técnica de angulación del codo con relación al antebrazo y bíceps en cada bloque.'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Bases y desplazamientos sin paso en falso',
        points: [
          'Posiciones de paso largo al frente con énfasis en la pierna de atrás estirada completamente, Posición Adelantada 70/30.',
          'Desplazamientos de Media Luna sin mover los pies.',
          'No ajustar las posiciones al avanzar.',
          'Posturas atrasada 70/30 (Kokutsu Dachi) pie de adelante hacia adelante',
          'Movimiento de técnica de tren superior con desplazamiento de piernas (Postura primero y luego la técnica)',
          'Manejo correcto de la distancia en Sam -Bon -Kumite.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Pie base y trayectoria',
        points: [
          'Énfasis en el movimiento o no movimiento del pie base según la patada.'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Heian Shodan & Heian Nidan)',
        subtitle: 'Forma oficial y embusen',
        points: [
          'Posturas oficiales (Zenkutsu, Kokutsu, Kiba Dachi) firmes y estables.',
          'Técnicas (Waza): Precisión mecánica y embusen oficial en Heian Shodan y Heian Nidan.',
          'Ritmo, respiración correcta y Kime en los movimientos de ataque y defensa.'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Sambon Kumite)',
        subtitle: 'Distancia (Ma-ai), control y reflejos',
        points: [
          'Manejo correcto de la distancia en Sam -Bon -Kumite.',
          'Control técnico, anticipación y reflejos sin contacto desmedido.',
          'Zanshin y postura de combate firme (Kamae).'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES FISICAS COORDINATIVAS',
        subtitle: 'Ritmo y respiración',
        points: [
          'Desarrollo del ritmo mediante la respiración correcta por cada técnica.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Disciplina y kiai',
        points: [
          'Disciplina en cuanto a la frecuencia a los entrenamientos.',
          'Utilización del KIAI en el momento correcto de la técnica.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Etiqueta, rituales y vocabulario',
        points: [
          'Respuesta más rápida hacia los comandos que se le piden.',
          'Memorización del ritual del saludo inicial y final de la clase (Seiretsu,seiza, mokutso) etc.',
          'Dominio del vocabulario técnico (golpes, defensas aposiciones y ataques)',
          'Vocabulario básico general (Dojo- Kun)'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-9-8-k1',
        group: 'kihon',
        name: 'Chudan Oi zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-9-8-k2',
        group: 'kihon',
        name: 'Jodan Age Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-9-8-k3',
        group: 'kihon',
        name: 'Chudan Soto Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 3,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última, ida y vuelta.'
      },
      {
        id: 'tech-9-8-k4',
        group: 'kihon',
        name: 'Chudan Uchi Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última, ida y vuelta.'
      },
      {
        id: 'tech-9-8-k5',
        group: 'kihon',
        name: 'Gedan Barai',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última, ida y vuelta.'
      },
      {
        id: 'tech-9-8-k6',
        group: 'kihon',
        name: 'Chudan Shuto Uke',
        stance: 'Kokutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-9-8-k7',
        group: 'kihon',
        name: 'Mae Geri Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-9-8-ku1',
        group: 'kumite',
        name: 'Sambon Kumite (Jodan Zuki)',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Atrás',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku Kumite: Sambon Kumite (Jodan Zuki).'
      },
      {
        id: 'tech-9-8-ka1',
        group: 'kata',
        name: 'Heian Shodan',
        stance: 'Zenkutsu / Kokutsu Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 9,
        embusen: 'Embusen Oficial',
        notes: 'Heian Shodan.'
      },
      {
        id: 'tech-9-8-ka2',
        group: 'kata',
        name: 'Heian Nidan',
        stance: 'Zenkutsu / Kokutsu / Kiba Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 10,
        embusen: 'Embusen Oficial',
        notes: 'Heian Nidan.'
      }
    ]
  },
  {
    name: 'Temario Oficial: Cinturón Naranja (Examen de 8 Kyu a 7 Kyu)',
    currentRank: '8° Kyu (Cinta Naranja)',
    targetRank: '7° Kyu (Cinta Verde)',
    targetRanks: ['8° Kyu (Cinta Naranja)', '7° Kyu (Cinta Verde)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Naranja (Examen de 8 Kyu a 7 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Relación Tsuki te / Hikite y postura',
        points: [
          'Inicia relación entre el Tsuki te y el Hikite según técnica.',
          'Tronco recto, hombros hacia abajo, vista al frente al horizonte, barbilla levantada.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Angulación de codo y distancia al cuerpo',
        points: [
          'Mecánica de la técnica de angulación del codo con relación al dorso según cada bloqueo, (un puño entre el codo y el costado del cuerpo)'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Bases, flexión, talones y cadera',
        points: [
          'Posiciones de paso largo al frente con énfasis en la pierna delantera en forma correcta (Rodilla sobre los dedos de los pies) Zenkutsu-Dachi 70/30',
          'Desplazamientos de Media Luna hacia atrás sin mover ni levantar el talón.',
          'Postura atrasada (Kokutsu Dachi) con flexión de rodilla delantera.',
          'Manejo correcto de la distancia en Sam -Bon -Kumite (medición de rodilla con respecto al oponente).',
          'Inicio de utilización de la cadera con relación al bloqueo.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Relación tronco/patada y guardia',
        points: [
          'Buena relación entre el tronco y el desarrollo de la patada',
          'Preparación de la guardia dentro de la ejecución de la patada'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Heian Sandan)',
        subtitle: 'Forma oficial y embusen',
        points: [
          'Posturas oficiales (Zenkutsu, Kokutsu, Kiba Dachi) firmes y estables.',
          'Técnicas oficiales de Heian Sandan con precisión mecánica y transiciones limpias.',
          'Ritmo marcial, respiración coordinada, Kime y fidelidad al Embusen oficial.'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Sambon Kumite: Jodan y Chudan)',
        subtitle: 'Distancia (Ma-ai), medición y control',
        points: [
          'Manejo correcto de la distancia en Sam -Bon -Kumite (medición de rodilla con respecto al oponente).',
          'Defensa y contraataque coordinado en Jodan Zuki y Chudan Zuki.',
          'Inicio de utilización de cadera, zanshin y control técnico sin contacto.'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES FISICAS COORDINATIVAS',
        subtitle: 'Coordinación desplazamiento y técnica',
        points: [
          'Desarrollo de la coordinación entre desplazamiento y la técnica.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Pertenencia y capacidad neuromuscular',
        points: [
          'Fomentar la pertenecía al Dojo y a su grupo de trabajo.',
          'Mejorar la capacidad de Neuro-Muscular.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Esfuerzo, direcciones y Niju Kun',
        points: [
          'Mejorar el sentido de esfuerzo al entrenar.',
          'Dominio del vocabulario técnico (derecho izquierdo adelante atrás)',
          'Vocabulario básico general (Primeros 5 conceptos del NIYIKUM)'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-8-7-k1',
        group: 'kihon',
        name: 'Chudan Oi zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k2',
        group: 'kihon',
        name: 'Chudan Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k3',
        group: 'kihon',
        name: 'Jodan Age Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 3,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k4',
        group: 'kihon',
        name: 'Chudan Soto Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k5',
        group: 'kihon',
        name: 'Chudan Uchi Uke',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k6',
        group: 'kihon',
        name: 'Gedan Barai',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces última, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k7',
        group: 'kihon',
        name: 'Chudan Shuto Uke',
        stance: 'Kokutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k8',
        group: 'kihon',
        name: 'Mae Geri Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-8-7-k9',
        group: 'kihon',
        name: 'Yoko Geri Keague',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 9,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-8-7-ku1',
        group: 'kumite',
        name: 'Sambon Kumite (Jodan Zuki y Chudan zuki)',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Atrás',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 10,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku Kumite: Sambon Kumite (Jodan Zuki y Chudan zuki).'
      },
      {
        id: 'tech-8-7-ka1',
        group: 'kata',
        name: 'Heian Sandan',
        stance: 'Kokutsu / Zenkutsu / Kiba Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 11,
        embusen: 'Embusen Oficial',
        notes: 'Heian Sandan.'
      }
    ]
  },
  {
    name: 'Temario Oficial: Cinturón Verde (Examen de 7 Kyu a 6 Kyu)',
    currentRank: '7° Kyu (Cinta Verde)',
    targetRank: '6° Kyu (Cinta Azul)',
    targetRanks: ['7° Kyu (Cinta Verde)', '6° Kyu (Cinta Azul)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Verde (Examen de 7 Kyu a 6 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Movimiento y manejo de cadera en combinaciones',
        points: [
          'Movimiento de cadera en relación del golpe.',
          'Manejo de la Cadera en los movimientos básicos combinados.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Uso de cadera en bloqueos',
        points: [
          'Movimiento de cadera según técnica de bloqueo.'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Flexión, cadera, balance y peso corporal',
        points: [
          'Posiciones de paso largo al frente con ENFASIS EN FLEXION CORRECTA EXTENCION DE LA RODILLA TRASERA SEGÚN UTILIZACION DE LA CADERA',
          'Desplazamientos de Media Luna utilizando la proyección de cadera al avanzar o retroceder.',
          'Postura atrasada (kokutsu dachi) Con el balance correcto del peso del cuerpo.',
          'Manejo correcto de la cadera dentro del Kumite comprometido.',
          'Manejo del peso corporal según técnica.',
          'Activación de la pierna adecuada para los diferentes desplazamientos para lograr la correcta utilización de los músculos.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Aplicación de cadera en patadas',
        points: [
          'Aplicación de la cadera según patada.'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Heian Yondan)',
        subtitle: 'Forma oficial, kosa dachi y embusen',
        points: [
          'Posturas oficiales (Kokutsu, Zenkutsu, Kiba Dachi y Kosa Dachi) firmes con centro de gravedad estable.',
          'Técnicas de Heian Yondan (Morote Uke, Juji Uke, Kakiwake Uke, Yoko Geri / Uraken, Mae Geri / Empi, Shuto Uke).',
          'Ritmo, fluidez, respiración coordinada, Kime y fidelidad al Embusen oficial.'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Kihon Ippon Kumite: Jodan, Chudan y Mae Geri)',
        subtitle: 'Cadera, distancia y control comprometido',
        points: [
          'Manejo correcto de la cadera dentro del Kumite comprometido.',
          'Distancia (Ma-ai), control de impacto y bloqueo defensivo en Jodan Zuki, Chudan Zuki y Mae Geri.',
          'Zanshin, contraataque decisivo (Gyaku Zuki) y postura de combate firme.'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES FISICAS COORDINATIVAS',
        subtitle: 'Fuerza en básicos y resistencia mental',
        points: [
          'Aplicación de la fuerza en los movimientos básicos.',
          'Utilización de su capacidad mental para resistencia a la carga de entrenamiento.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Fluidez y reproducción técnica',
        points: [
          'Facilidad en la reproducción de los movimientos técnicos con fluidez.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Responsabilidad con inferiores, semicirculares y Niju Kun',
        points: [
          'Fomentar la responsabilidad de cuidar y ayudar a los cinturones inferiores.',
          'Vocabulario básico general golpe Semi- circulares.',
          'Dominio del vocabulario (5 conceptos del NIYIKUM).'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-7-6-k1',
        group: 'kihon',
        name: 'Chudan Oi zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k2',
        group: 'kihon',
        name: 'Chudan Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k3',
        group: 'kihon',
        name: 'Jodan Age Uke - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 3,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k4',
        group: 'kihon',
        name: 'Chudan Soto Uke - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k5',
        group: 'kihon',
        name: 'Chudan Uchi Uke - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k6',
        group: 'kihon',
        name: 'Gedan Barai - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k7',
        group: 'kihon',
        name: 'Chudan Shuto Uke - Nukite en Zenkutsu Dachi',
        stance: 'Kokutsu Dachi / Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. Chudan Shuto Uke - Nukite en Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k8',
        group: 'kihon',
        name: 'Mae Geri Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-k9',
        group: 'kihon',
        name: 'Yoko Geri Keague',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 9,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-7-6-ku1',
        group: 'kumite',
        name: 'Kihon Ippon Kumite (Jodan Zuki, Chudan zuki y Mae Geri)',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Atrás',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 10,
        embusen: 'Embusen Oficial',
        notes: 'Kihon Ippon Kumite (Jodan Zuki, Chudan zuki y Mae Geri).'
      },
      {
        id: 'tech-7-6-ka1',
        group: 'kata',
        name: 'Heian Yondan',
        stance: 'Kokutsu / Zenkutsu / Kiba Dachi / Kosa Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 11,
        embusen: 'Embusen Oficial',
        notes: 'Heian Yondan.'
      }
    ]
  },
  {
    name: 'Temario Oficial: Cinturón Azul (Examen de 6 Kyu a 5 Kyu)',
    currentRank: '6° Kyu (Cinta Azul)',
    targetRank: '5° Kyu (Cinta Morada)',
    targetRanks: ['6° Kyu (Cinta Azul)', '5° Kyu (Cinta Morada)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Azul (Examen de 6 Kyu a 5 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Coordinación con capacidad física inicial',
        points: [
          'Coordinación entre la aplicación de técnica del golpe con la capacidad física en nivel inicial.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Coordinación con capacidad física inicial',
        points: [
          'Coordinación entre la aplicación de técnica del bloqueo con la capacidad física en nivel inicial.'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Firmeza de rodilla, nivel de cadera y desplazamientos laterales',
        points: [
          'Posiciones de paso largo al frente con ENFASIS NO DESPLAZAR DE LA RODILLA DELANTERA DE UN LADO A OTRO (izquierda-derecha)',
          'Desplazamientos de Media Luna con la cadera al mismo nivel.',
          'Postura atrasada (Kokutsu Dachi) ubicación de la pierna delantera con respecto al tronco.',
          'Manejo correcto del desplazamiento lateral.',
          'Manejo del peso corporal según técnica.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Estabilidad de cadera en patadas',
        points: [
          'Aplicación del Geri sin elevar el nivel de la cadera.'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Heian Godan)',
        subtitle: 'Forma oficial, salto, transiciones y embusen',
        points: [
          'Posturas oficiales (Kokutsu, Zenkutsu, Kiba Dachi, Renoji Dachi y Kosa Dachi) firmes y estables.',
          'Técnicas oficiales de Heian Godan (Kagi Zuki, Morote Uke, Mizu Nagare no Kamae, salto con Kiai, Manji Uke).',
          'Ritmo, fluidez, respiración coordinada, Kime y fidelidad al Embusen oficial.'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Kihon Ippon Kumite: 2 Repeticiones c/u Diferente)',
        subtitle: 'Distancia, control y técnica con Yoko Geri',
        points: [
          'Manejo correcto de la distancia (Ma-ai) y desplazamiento en ataque y defensa con Yoko Geri.',
          'Control de las técnicas con un oponente sin contacto lesivo (2 repeticiones cada lado).',
          'Zanshin, anticipación, reflejos y contraataque explosivo.'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'COMPONENTES FISICOS',
        subtitle: 'Resistencia y potencia en básicos',
        points: [
          'Aplicación de la resistencia y potencia a los movimientos básicos.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Fluidez e improvisación técnica',
        points: [
          'Facilidad en la reproducción de los movimientos técnicos con fluidez e improvisación de movimientos.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Control con oponente, golpes de codo y Niju Kun',
        points: [
          'Mejorar el control de las técnicas con un oponente.',
          'Vocabulario básico general golpes de codo.',
          'Dominio del vocabulario (5 conceptos del NIYIKUM).'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-6-5-k1',
        group: 'kihon',
        name: 'Chudan Oi zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k2',
        group: 'kihon',
        name: 'Chudan Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k3',
        group: 'kihon',
        name: 'Jodan Age Uke - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 3,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k4',
        group: 'kihon',
        name: 'Chudan Soto Uke - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k5',
        group: 'kihon',
        name: 'Chudan Uchi Uke - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k6',
        group: 'kihon',
        name: 'Gedan Barai - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k7',
        group: 'kihon',
        name: 'Chudan Shuto Uke - Nukite en Zenkutsu Dachi',
        stance: 'Kokutsu Dachi / Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. Chudan Shuto Uke - Nukite en Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k8',
        group: 'kihon',
        name: 'Mae Geri Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k9',
        group: 'kihon',
        name: 'Yoko Geri Keague',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 9,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-k10',
        group: 'kihon',
        name: 'Yoko Geri Kekomi',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 10,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-6-5-ku1',
        group: 'kumite',
        name: 'Kihon Ippon Kumite (Jodan Zuki, Chudan zuki, Mae Geri y Yoko Geri.)',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Atrás',
        repetitions: 2,
        tripType: 'ida_y_vuelta',
        order: 11,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku Kumite (2-Rep C/U-Dif): Kihon Ippon Kumite (Jodan Zuki, Chudan zuki, Mae Geri y Yoko Geri).'
      },
      {
        id: 'tech-6-5-ka1',
        group: 'kata',
        name: 'Heian Godan',
        stance: 'Kokutsu / Zenkutsu / Kiba Dachi / Kosa Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 12,
        embusen: 'Embusen Oficial',
        notes: 'Heian Godan.'
      }
    ]
  }
];

/**
 * Obtener todos los temarios registrados, sembrando los por defecto si la colección está vacía
 */
export async function getExamSyllabi(targetRankFilter = null) {
  try {
    await dbConnect();

    const count = await ExamSyllabus.countDocuments();
    if (count === 0) {
      // Sembrar temario oficial inicial
      await ExamSyllabus.insertMany(DEFAULT_INITIAL_SYLLABI);
    }

    const query = { isActive: { $ne: false } };
    if (targetRankFilter && targetRankFilter !== 'all') {
      query.targetRank = targetRankFilter;
    }

    const docs = await ExamSyllabus.find(query).lean();

    // Ordenar de acuerdo a la jerarquía oficial de grados (10° Kyu, 9° Kyu, 8° Kyu...)
    docs.sort((a, b) => {
      const normA = normalizeRankKey(a.currentRank || a.targetRank);
      const normB = normalizeRankKey(b.currentRank || b.targetRank);
      const idxA = KYU_DEFINITIONS.findIndex(k => normalizeRankKey(k.full) === normA || k.id === normA);
      const idxB = KYU_DEFINITIONS.findIndex(k => normalizeRankKey(k.full) === normB || k.id === normB);
      const posA = idxA === -1 ? 999 : idxA;
      const posB = idxB === -1 ? 999 : idxB;
      if (posA !== posB) return posA - posB;
      return (a.name || '').localeCompare(b.name || '');
    });

    return docs.map(doc => ({
      _id: doc._id.toString(),
      id: doc._id.toString(),
      name: doc.name,
      currentRank: doc.currentRank,
      targetRank: doc.targetRank,
      description: doc.description || '',
      isOfficial: Boolean(doc.isOfficial),
      version: Number(doc.version) || 1,
      techniques: (doc.techniques || []).map(t => ({
        id: t.id || Math.random().toString(36).substring(2, 9),
        group: t.group,
        name: t.name,
        stance: t.stance || 'Zenkutsu Dachi',
        direction: t.direction || 'Adelante (Mae)',
        repetitions: Number(t.repetitions) || 3,
        tripType: t.tripType || 'ida_y_vuelta',
        order: Number(t.order) || 0,
        embusen: t.embusen || (t.group === 'kata' ? 'Embusen Oficial' : ''),
        notes: t.notes || ''
      })),
      technicalAspects: Array.isArray(doc.technicalAspects) ? doc.technicalAspects.map(a => ({
        id: a.id || Math.random().toString(36).substring(2, 9),
        category: a.category || 'tsuki',
        categoryLabel: a.categoryLabel || '1. Aspectos Técnicos',
        title: a.title || '',
        subtitle: a.subtitle || '',
        points: Array.isArray(a.points) ? a.points : [],
        order: Number(a.order) || 0
      })) : DEFAULT_TECHNICAL_ASPECTS,
      createdBy: doc.createdBy || 'Comisión Técnica',
      createdAt: doc.createdAt?.toISOString() || null,
      updatedAt: doc.updatedAt?.toISOString() || null
    }));
  } catch (error) {
    console.error('Error al obtener temarios de examen:', error);
    return [];
  }
}

/**
 * Crear un nuevo temario de examen
 */
export async function createExamSyllabus(data) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para crear temarios de examen.' };
    }

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Datos de temario inválidos.' };
    }

    await dbConnect();

    const name = sanitizeString(data.name, 150);
    const currentRank = sanitizeString(data.currentRank, 80) || '10° Kyu (Cinta Blanca)';
    const targetRank = sanitizeString(data.targetRank, 80);
    const description = sanitizeString(data.description, 1000);

    if (!name) {
      return { success: false, error: 'El nombre del temario es obligatorio.' };
    }
    if (!targetRank) {
      return { success: false, error: 'El cinturón a evaluar es obligatorio.' };
    }

    const rawTechniques = Array.isArray(data.techniques) ? data.techniques.slice(0, 100) : [];
    const cleanedTechniques = rawTechniques.map((t, idx) => {
      const group = ['kihon', 'kumite', 'kata'].includes(t.group) ? t.group : 'kihon';
      const tripType = t.tripType === 'solo_ida' ? 'solo_ida' : 'ida_y_vuelta';
      return {
        id: sanitizeString(t.id, 50) || `tech-${Date.now()}-${idx}`,
        group,
        name: sanitizeString(t.name, 120) || 'Técnica sin nombre',
        stance: sanitizeString(t.stance, 80) || 'Zenkutsu Dachi',
        direction: sanitizeString(t.direction, 80) || 'Adelante (Mae)',
        repetitions: Math.max(1, Math.min(20, parseInt(t.repetitions, 10) || 3)),
        tripType,
        order: idx + 1,
        embusen: sanitizeString(t.embusen, 100) || (group === 'kata' ? 'Embusen Oficial' : ''),
        notes: sanitizeString(t.notes, 300)
      };
    });

    const newSyllabus = await ExamSyllabus.create({
      name,
      currentRank,
      targetRank,
      description,
      isOfficial: true,
      techniques: cleanedTechniques,
      technicalAspects: Array.isArray(data.technicalAspects) ? data.technicalAspects : DEFAULT_TECHNICAL_ASPECTS,
      createdBy: sanitizeString(session.user.name, 100) || 'Comisión Técnica ISKF'
    });

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return {
      success: true,
      syllabus: {
        _id: newSyllabus._id.toString(),
        id: newSyllabus._id.toString(),
        name: newSyllabus.name,
        targetRank: newSyllabus.targetRank,
        currentRank: newSyllabus.currentRank
      }
    };
  } catch (error) {
    console.error('Error al crear temario de examen:', error);
    return { success: false, error: 'Error al procesar la creación del temario.' };
  }
}

/**
 * Actualizar un temario de examen existente
 */
export async function updateExamSyllabus(id, data) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para editar temarios.' };
    }

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'ID de temario inválido.' };
    }

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Datos de temario inválidos.' };
    }

    await dbConnect();

    const name = sanitizeString(data.name, 150);
    const currentRank = sanitizeString(data.currentRank, 80);
    const targetRank = sanitizeString(data.targetRank, 80);
    const description = sanitizeString(data.description, 1000);

    if (!name || !targetRank) {
      return { success: false, error: 'Nombre y cinturón a evaluar son requeridos.' };
    }

    const rawTechniques = Array.isArray(data.techniques) ? data.techniques.slice(0, 100) : [];
    const cleanedTechniques = rawTechniques.map((t, idx) => {
      const group = ['kihon', 'kumite', 'kata'].includes(t.group) ? t.group : 'kihon';
      const tripType = t.tripType === 'solo_ida' ? 'solo_ida' : 'ida_y_vuelta';
      return {
        id: sanitizeString(t.id, 50) || `tech-${Date.now()}-${idx}`,
        group,
        name: sanitizeString(t.name, 120) || 'Técnica sin nombre',
        stance: sanitizeString(t.stance, 80) || 'Zenkutsu Dachi',
        direction: sanitizeString(t.direction, 80) || 'Adelante (Mae)',
        repetitions: Math.max(1, Math.min(20, parseInt(t.repetitions, 10) || 3)),
        tripType,
        order: idx + 1,
        embusen: sanitizeString(t.embusen, 100) || (group === 'kata' ? 'Embusen Oficial' : ''),
        notes: sanitizeString(t.notes, 300)
      };
    });

    const updatePayload = {
      name,
      currentRank: currentRank || '10° Kyu (Cinta Blanca)',
      targetRank,
      description,
      techniques: cleanedTechniques
    };

    if (Array.isArray(data.technicalAspects)) {
      updatePayload.technicalAspects = data.technicalAspects;
    }

    const existing = await ExamSyllabus.findById(id).lean();
    if (!existing) {
      return { success: false, error: 'Temario no encontrado.' };
    }
    updatePayload.version = (existing.version || 1) + 1;

    const updatedDoc = await ExamSyllabus.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: false }
    ).lean();

    if (updatedDoc) {
      await syncOpenCallsSnapshots(updatedDoc);
    }

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar temario de examen:', error);
    return { success: false, error: 'Error al procesar la actualización del temario.' };
  }
}

/**
 * Eliminar un temario de examen
 */
export async function deleteExamSyllabus(id) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Solo los administradores pueden eliminar temarios oficiales.' };
    }

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'ID de temario inválido.' };
    }

    await dbConnect();
    await ExamSyllabus.findByIdAndDelete(id);

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar temario:', error);
    return { success: false, error: 'Error al procesar la eliminación del temario.' };
  }
}

/**
 * Actualizar exclusivamente los aspectos técnicos y rúbrica oficial de un temario en base de datos
 */
export async function updateSyllabusTechnicalAspects(syllabusId, technicalAspects) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return { success: false, error: 'No tienes permisos para editar los aspectos técnicos.' };
    }

    // Validación estricta de ID para prevenir NoSQL injection
    if (!syllabusId || typeof syllabusId !== 'string' || !mongoose.Types.ObjectId.isValid(syllabusId)) {
      return { success: false, error: 'Identificador de temario inválido.' };
    }

    if (!Array.isArray(technicalAspects)) {
      return { success: false, error: 'La estructura de aspectos técnicos debe ser una lista válida.' };
    }

    await dbConnect();

    // Sanitización, límites de payload y tipado defensivo
    const cleanedAspects = technicalAspects.slice(0, 30).map((a, idx) => {
      const rawCategory = sanitizeString(a.category, 30).toLowerCase() || 'tsuki';
      const isSec2 = ['physical', 'mental', 'do'].includes(rawCategory);
      
      const safeCategory = ['tsuki', 'uke', 'dachi', 'geri', 'physical', 'mental', 'do', 'kata', 'kumite'].includes(rawCategory)
        ? rawCategory
        : 'tsuki';

      const safePoints = (Array.isArray(a.points) ? a.points : []).slice(0, 50).map(p => {
        if (!p) return null;
        if (typeof p === 'object') {
          const rawText = p.text || p.point || p.rawText || '';
          const text = sanitizeString(rawText, 300);
          if (!text) return null;
          return {
            text,
            isEvaluable: Boolean(p.isEvaluable === true || p.evaluableInExam === true || p.evaluable === true)
          };
        }
        const text = sanitizeString(p, 300);
        if (!text) return null;
        return {
          text,
          isEvaluable: !isSec2
        };
      }).filter(Boolean);

      return {
        id: sanitizeString(a.id, 50) || `aspect-${Date.now()}-${idx}`,
        category: safeCategory,
        categoryLabel: sanitizeString(a.categoryLabel, 100) || (isSec2 ? '2. Aspectos Físicos, Mentales y DO' : '1. Aspectos Técnicos'),
        title: sanitizeString(a.title, 150) || 'Aspecto Normativo',
        subtitle: sanitizeString(a.subtitle, 250),
        points: safePoints,
        order: typeof a.order === 'number' && Number.isFinite(a.order) ? Math.max(0, Math.min(1000, a.order)) : idx
      };
    });

    const updated = await ExamSyllabus.findByIdAndUpdate(
      syllabusId,
      { $set: { technicalAspects: cleanedAspects } },
      { new: true, runValidators: false }
    ).lean();

    if (!updated) {
      return { success: false, error: 'Temario no encontrado.' };
    }

    await syncOpenCallsSnapshots(updated);

    revalidatePath('/admin/examinations/syllabi');
    revalidatePath('/admin/examinations/technical');

    return { 
      success: true, 
      technicalAspects: cleanedAspects 
    };
  } catch (error) {
    console.error('Error al actualizar aspectos técnicos:', error);
    return { success: false, error: 'Error al procesar la actualización en base de datos.' };
  }
}
