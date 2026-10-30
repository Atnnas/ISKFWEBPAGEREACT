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
  },
  {
    name: 'Temario Oficial: Cinturón Morado (Examen de 5 Kyu a 4 Kyu)',
    currentRank: '5° Kyu (Cinta Morada)',
    targetRank: '4° Kyu (Cinta Morada con Línea Blanca)',
    targetRanks: ['5° Kyu (Cinta Morada)', '4° Kyu (Cinta Morada con Línea Blanca)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Morado (Examen de 5 Kyu a 4 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Coordinación técnica con capacidad física',
        points: [
          'Coordinación entre la aplicación de técnica del golpe con la capacidad física.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Coordinación técnica con capacidad física',
        points: [
          'Coordinación entre la aplicación de técnica del bloqueo con la capacidad física.'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Translación de posturas, cadera y desplazamiento diagonal',
        points: [
          'Translación de Posiciones de paso largo al frente con posición atrasada.',
          'Desplazamientos de Media Luna con la cadera al mismo nivel.',
          'Postura atrasada (Kokutsu Dachi) con la cadera en dirección de la rodilla atrasada.',
          'Manejo correcto del desplazamiento diagonal.',
          'Manejo del peso corporal según técnica.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Forma correcta del pie según patada',
        points: [
          'Aplicación del Geri dándole énfasis a la forma correcta del pie según patada (Mawashi Geri Kiba Dachi Kokutsu Dachi)'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Tekki Shodan)',
        subtitle: 'Forma oficial, kiba dachi y embusen lineal',
        points: [
          'Postura Kiba Dachi firme y baja con rodillas hacia afuera y centro de gravedad constante.',
          'Técnicas oficiales de Tekki Shodan (Kagi Zuki, Haishu Uke, Empi Uchi, Morote Uke, Nami Gaeshi).',
          'Ritmo, fluidez, respiración coordinada, Kime y desplazamiento en línea recta (Embusen).'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Kihon Ippon Kumite: 2 Repeticiones c/u Diferente)',
        subtitle: 'Distancia, control, Yoko Geri y Mawashi Geri',
        points: [
          'Manejo correcto de la distancia (Ma-ai) y desplazamiento en ataque y defensa con Mawashi Geri.',
          'Control de las técnicas con un oponente sin contacto lesivo (2 repeticiones cada lado diferente).',
          'Actitud de combate, zanshin, anticipación, reflejos y contraataque explosivo.'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'COMPONENTES FISICOS',
        subtitle: 'Agilidad y flexo elasticidad en piernas',
        points: [
          'Desarrollo de la agilidad y flexo elasticidad a los movimientos básicos énfasis en piernas.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Actitud de combate y concentración en enfoque',
        points: [
          'Actitud de combate.',
          'Concentración en el enfoque de la técnica.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Carácter fuerte, golpes de codo y Niju Kun',
        points: [
          'Evitar la autocompasión y desarrollo de un carácter fuerte.',
          'Vocabulario básico general golpes de codo.',
          'Dominio del vocabulario (5 conceptos del NIYIKUM).'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-5-4-k1',
        group: 'kihon',
        name: 'Chudan Sambon zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-5-4-k2',
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
        id: 'tech-5-4-k3',
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
        id: 'tech-5-4-k4',
        group: 'kihon',
        name: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken',
        stance: 'Zenkutsu Dachi / Kiba Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-5-4-k5',
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
        id: 'tech-5-4-k6',
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
        notes: 'Kokutsu Dachi. Chudan Shuto Uke - Nukite en Zenkutsu Dachi (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-5-4-k8',
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
        id: 'tech-5-4-k9',
        group: 'kihon',
        name: 'Mawashi Geri',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 9,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Mawashi Geri (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-5-4-k10',
        group: 'kihon',
        name: 'Yoko Geri Keague',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 10,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-5-4-k11',
        group: 'kihon',
        name: 'Yoko Geri Kekomi',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 11,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-5-4-ku1',
        group: 'kumite',
        name: 'Kihon Ippon Kumite (Jodan Zuki, Chudan zuki, Mae Geri, Yoko Geri y Mawashi Geri)',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Atrás',
        repetitions: 2,
        tripType: 'ida_y_vuelta',
        order: 12,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku Kumite (2-Rep C/U-Dif): Kihon Ippon Kumite (Jodan Zuki, Chudan zuki, Mae Geri, Yoko Geri y Mawashi Geri).'
      },
      {
        id: 'tech-5-4-ka1',
        group: 'kata',
        name: 'Tekki Shodan',
        stance: 'Kiba Dachi',
        direction: 'Embusen Oficial (Lineal)',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 13,
        embusen: 'Embusen Oficial',
        notes: 'Tekki Shodan.'
      }
    ]
  },
  {
    name: 'Temario Oficial: Cinturón Morado Avanzado (Examen de 4 Kyu a 3 Kyu)',
    currentRank: '4° Kyu (Cinta Morada con Línea Blanca)',
    targetRank: '3° Kyu (Cinta Marrón 3)',
    targetRanks: ['4° Kyu (Cinta Morada con Línea Blanca)', '3° Kyu (Cinta Marrón 3)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Morado con Línea Blanca (Examen de 4 Kyu a 3 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Tensión y relajación en el golpe',
        points: [
          'Aplicación de la tensión relajación en la técnica del Tzuki.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Tensión y relajación en el bloqueo',
        points: [
          'Aplicación de la tensión relajación en la técnica de bloqueo.'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Desplazamientos rápidos y coordinados',
        points: [
          'Desplazamientos rápidos y coordinados.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Tensión y relajación en patadas',
        points: [
          'Aplicación de la tensión relajación al Geri.'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Bassai Dai y Kanku Dai)',
        subtitle: 'Formas superiores, dinámica y embusen',
        points: [
          'Posturas oficiales (Zenkutsu, Kokutsu, Kiba Dachi, Kosa Dachi) con máxima estabilidad.',
          'Técnicas oficiales de Bassai Dai y Kanku Dai ejecutadas con dinámica de tensión-relajación.',
          'Potencia explosiva, ritmo marcial, respiración coordinada, Kime y fidelidad al Embusen oficial.'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Jiyu Ippon Kumite: 2 Repeticiones c/u Diferente)',
        subtitle: 'Combate semilibre, distancia y Sun dome',
        points: [
          'Transición y dinámica marcial de Jiyu Ippon Kumite (2 repeticiones c/u diferente).',
          'Manejo de la distancia (Ma-ai), timing de entrada, defensa y contraataque con Kime y Sun dome (a 3 cm).',
          'Zanshin continuo, guardia fluida y control estricto sin contacto.'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'COMPONENTES FISICOS',
        subtitle: 'Coordinación, potencia, fuerza y resistencia',
        points: [
          'Manejo de la coordinación.',
          'Desarrollo de las destrezas físicas de potencia, fuerza y resistencia.',
          'Buena expresión corporal.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Habilidades básicas y pensamiento analítico',
        points: [
          'Incremento de habilidades básicas y pensamiento analíticas según técnicas de pie y mano.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Kime, Sun dome, mano abierta y Niju Kun',
        points: [
          'Aumento del Kime y el Sun dome. (Detener una técnica a 3 cm del Objetivo enfocada)',
          'Vocabulario básico general golpes de mano abierta.',
          'Dominio del vocabulario (5 conceptos del NIYIKUM).'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-4-3-k1',
        group: 'kihon',
        name: 'Chudan Sambon zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-4-3-k2',
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
        id: 'tech-4-3-k3',
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
        id: 'tech-4-3-k4',
        group: 'kihon',
        name: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken',
        stance: 'Zenkutsu Dachi / Kiba Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-4-3-k5',
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
        id: 'tech-4-3-k6',
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
        id: 'tech-4-3-k7',
        group: 'kihon',
        name: 'Chudan Shuto Uke - Nukite en Zenkutsu Dachi',
        stance: 'Kokutsu Dachi / Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. Chudan Shuto Uke - Nukite en Zenkutsu Dachi (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-4-3-k8',
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
        id: 'tech-4-3-k9',
        group: 'kihon',
        name: 'Mawashi Geri',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 9,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Mawashi Geri (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-4-3-k10',
        group: 'kihon',
        name: 'Yoko Geri Keague',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 10,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-4-3-k11',
        group: 'kihon',
        name: 'Yoko Geri Kekomi',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 11,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-4-3-ku1',
        group: 'kumite',
        name: 'Jiyu Ippon Kumite (Jodan Zuki, Chudan zuki y Mae Geri)',
        stance: 'Kamae (Guardia libre)',
        direction: 'Adelante / Atrás',
        repetitions: 2,
        tripType: 'ida_y_vuelta',
        order: 12,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku Kumite (2-Rep C/U-Dif): Jiyu Ippon Kumite (Jodan Zuki, Chudan zuki y Mae Geri).'
      },
      {
        id: 'tech-4-3-ka1',
        group: 'kata',
        name: 'Bassai Dai y Kanku Dai',
        stance: 'Zenkutsu / Kokutsu / Kiba Dachi / Kosa Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 13,
        embusen: 'Embusen Oficial',
        notes: 'Bassai Dai y Kanku Dai. (Incluye I Parte Examen Escrito).'
      }
    ]
  },
  {
    name: 'Temario Oficial: Cinturón Marrón 3 (Examen de 3 Kyu a 2 Kyu)',
    currentRank: '3° Kyu (Cinta Marrón 3)',
    targetRank: '2° Kyu (Cinta Marrón 2)',
    targetRanks: ['3° Kyu (Cinta Marrón 3)', '2° Kyu (Cinta Marrón 2)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Marrón 3 (Examen de 3 Kyu a 2 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Transferencia de potencia al choque mediante impacto',
        points: [
          'Transferencia de la potencia física de la técnica de golpe al choque mediante un impacto.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Transferencia de potencia al bloqueo mediante impacto',
        points: [
          'Transferencia de la potencia física a la técnica de bloqueo mediante un impacto.'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Inicio del desarrollo de la Posición Kime',
        points: [
          'Inicio del desarrollo de la POSICION KIME.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Inicio del desarrollo de patadas con giros',
        points: [
          'Inicio del desarrollo de las patadas con giros.'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Empi y Tekki Nidan)',
        subtitle: 'Formas oficiales superiores, kime y embusen',
        points: [
          'Posturas oficiales firmes y estables (Zenkutsu, Kokutsu, Kiba Dachi).',
          'Técnicas oficiales de Empi y Tekki Nidan ejecutadas con transferencia de potencia física y Kime.',
          'Ritmo marcial, respiración coordinada, cambios de nivel, giros y fidelidad al Embusen oficial.',
          'Evaluación teórica complementaria (II Parte Examen Escrito).'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Jiyu Ippon Kumite: 2 Repeticiones c/u Diferente)',
        subtitle: 'Combate semilibre completo, distancia visual y control',
        points: [
          'Dinámica marcial de Jiyu Ippon Kumite completo (Jodan Zuki, Chudan zuki, Mae Geri, Yoko Geri y Mawashi Geri).',
          'Aplicación de la distancia visual para el Kumite y Sun dome.',
          'Timing, zanshin continuo y control absoluto sin contacto lesivo (2 repeticiones cada lado diferente).'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'COMPONENTES FISICOS',
        subtitle: 'Ubicación espacial, percepción kinestésica y distancia visual',
        points: [
          'Ubicación en el espacio según técnica.',
          'Desarrollo de la percepción Kinestetica.(Es la capacidad para usar todo el cuerpo para expresar ideas y sentimientos)',
          'Aplicación de la distancia visual para el Kumite.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Expresión oral, manejo de grupo y stress',
        points: [
          'Mejorar de la expresión oral.',
          'Manejo de grupo.',
          'Manejo del stress.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Conocimiento y análisis profundo del Dojo Kun',
        points: [
          'Conocimiento y análisis profundo del Dojo Kun.'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-3-2-k1',
        group: 'kihon',
        name: 'Chudan Sambon zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-3-2-k2',
        group: 'kihon',
        name: 'Sambon Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 5 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-3-2-k3',
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
        id: 'tech-3-2-k4',
        group: 'kihon',
        name: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken - Gyaku zuki',
        stance: 'Zenkutsu Dachi / Kiba Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken - Gyaku zuki (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-3-2-k5',
        group: 'kihon',
        name: 'Chudan Uchi Uke - Kizami zuki - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Chudan Uchi Uke - Kizami zuki - Gyaku zuki (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-3-2-k6',
        group: 'kihon',
        name: 'Chudan Shuto Uke - Kizami Mae Geri - Nukite en Zenkutsu Dachi',
        stance: 'Kokutsu Dachi / Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. Chudan Shuto Uke - Kizami Mae Geri - Nukite en Zenkutsu Dachi (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-3-2-k7',
        group: 'kihon',
        name: 'Ushiro Geri Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Giro',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Ushiro Geri Chudan (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-3-2-k8',
        group: 'kihon',
        name: 'Ura Mawashi Geri',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Ura Mawashi Geri (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-3-2-k9',
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
        id: 'tech-3-2-k10',
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
        id: 'tech-3-2-ku1',
        group: 'kumite',
        name: 'Jiyu Ippon Kumite (Jodan Zuki, Chudan zuki, Mae Geri, Yoko Geri y Mawashi Geri)',
        stance: 'Kamae (Guardia libre)',
        direction: 'Adelante / Atrás',
        repetitions: 2,
        tripType: 'ida_y_vuelta',
        order: 11,
        embusen: 'Embusen Oficial',
        notes: 'Yakusoku Kumite (2-Rep C/U-Dif): Jiyu Ippon Kumite (Jodan Zuki, Chudan zuki, Mae Geri, Yoko Geri y Mawashi Geri). 2 repeticiones cada lado diferente.'
      },
      {
        id: 'tech-3-2-ka1',
        group: 'kata',
        name: 'Empi y Tekki Nidan',
        stance: 'Zenkutsu / Kokutsu / Kiba Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 12,
        embusen: 'Embusen Oficial',
        notes: 'Empi y Tekki Nidan. (Incluye II Parte Examen Escrito).'
      }
    ]
  },
  {
    name: 'Temario Oficial: Cinturón Marrón 2 (Examen de 2 Kyu a 1 Kyu)',
    currentRank: '2° Kyu (Cinta Marrón 2)',
    targetRank: '1° Kyu (Cinta Marrón 1)',
    targetRanks: ['2° Kyu (Cinta Marrón 2)', '1° Kyu (Cinta Marrón 1)'],
    description: 'Temario oficial de evaluación técnica para Cinturón Marrón 2 (Examen de 2 Kyu a 1 Kyu) según el manual ISKF Costa Rica.',
    isOfficial: true,
    createdBy: 'Comisión Técnica ISKF Costa Rica',
    technicalAspects: [
      {
        id: 'aspect-tsuki',
        category: 'tsuki',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'TZUKI WAZA (Ataques de Puño)',
        subtitle: 'Teoría técnica y músculos implicados',
        points: [
          'Conocimiento y aplicación de la teoría de la técnica de ataque y músculos implicados en su ejecución.'
        ],
        order: 1
      },
      {
        id: 'aspect-uke',
        category: 'uke',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'UKE WAZA (Bloqueos y Defensas)',
        subtitle: 'Teoría de bloqueo y músculos implicados',
        points: [
          'Conocimiento y aplicación de la teoría de la técnica de bloqueo y músculos implicados en su ejecución.'
        ],
        order: 2
      },
      {
        id: 'aspect-dachi',
        category: 'dachi',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'DACHI WAZA (Posturas y Desplazamientos)',
        subtitle: 'Desarrollo intermedio de la Posición Kime',
        points: [
          'Desarrollo intermedio de la POSICION KIME.'
        ],
        order: 3
      },
      {
        id: 'aspect-geri',
        category: 'geri',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'GERI WAZA (Patadas)',
        subtitle: 'Control muscular físico y psíquico en patadas',
        points: [
          'Control muscular físico y psíquico en la aplicación de las patadas.'
        ],
        order: 4
      },
      {
        id: 'aspect-kata',
        category: 'kata',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KATA (Jion y Hangetsu)',
        subtitle: 'Formas superiores avanzadas, respiración Hangetsu y embusen',
        points: [
          'Posturas oficiales (Zenkutsu, Kiba Dachi y Hangetsu Dachi) firmes con control del centro de gravedad.',
          'Técnicas oficiales de Jion y Hangetsu con dominio de contracción-expansión y respiración coordinada.',
          'Kime profundo, ritmo marcial impecable y fidelidad estricta al Embusen oficial.',
          'Evaluación teórica complementaria (III Parte Examen Escrito).'
        ],
        order: 5
      },
      {
        id: 'aspect-kumite',
        category: 'kumite',
        categoryLabel: '1. Aspectos Técnicos',
        title: 'KUMITE (Jiyu Kumite - Kumite Libre)',
        subtitle: 'Combate libre marcial, control sin puntos y Sun dome',
        points: [
          'Kumite libre sin puntos (mayores de 45 años pueden hacer defensa personal).',
          'Aplicación de la distancia visual para el Kumite, timing, anticipación y Sun dome.',
          'Autocontrol emocional y físico absoluto, sin contacto lesivo.'
        ],
        order: 6
      },
      {
        id: 'aspect-physical',
        category: 'physical',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'COMPONENTES FISICOS',
        subtitle: 'Ubicación espacial, cinestesia, distancia visual y expresión emocional',
        points: [
          'Ubicación en el espacio según técnica.',
          'Desarrollo de la percepción Kinestetica.',
          'Aplicación de la distancia visual para el Kumite.',
          'Aumento de la interpretación y trasmisión de emociones mediante el físico.'
        ],
        order: 7
      },
      {
        id: 'aspect-mental',
        category: 'mental',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'CAPACIDADES MENTALES',
        subtitle: 'Criterios teóricos Shotokan y reglamento de competición',
        points: [
          'Manejo de los criterios teóricos de las técnicas de Karate Do Shotokan.',
          'Conocimiento Teórico practico del Reglamento de Competición.'
        ],
        order: 8
      },
      {
        id: 'aspect-do',
        category: 'do',
        categoryLabel: '2. Aspectos Físicos, Mentales y DO',
        title: 'DO (Camino y Protocolo Marcial)',
        subtitle: 'Espíritu de colaboración como Sempai',
        points: [
          'Alto espíritu de colaboración en el Dojo como Sempai.'
        ],
        order: 9
      }
    ],
    techniques: [
      {
        id: 'tech-2-1-k1',
        group: 'kihon',
        name: 'Jodan-Chudan Sambon zuki',
        stance: 'Zenkutsu Dachi - Gedan Barai (Hidari)',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 1,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi - Gedan Barai (Hidari). 3 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-2-1-k2',
        group: 'kihon',
        name: 'Sambon Gyaku zuki Chudan',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 2,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 3 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-2-1-k3',
        group: 'kihon',
        name: 'Jodan Age Uke - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 3,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. 3 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-2-1-k4',
        group: 'kihon',
        name: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken - Gyaku zuki',
        stance: 'Zenkutsu Dachi / Kiba Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 4,
        embusen: 'Embusen Oficial',
        notes: 'Chudan Soto Uke - Empi en Kiba Dachi - Uraken - Gyaku zuki (3 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-k5',
        group: 'kihon',
        name: 'Chudan Uchi Uke - Kizami zuki - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 5,
        embusen: 'Embusen Oficial',
        notes: 'Chudan Uchi Uke - Kizami zuki - Gyaku zuki (3 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-k6',
        group: 'kihon',
        name: 'Chudan Shuto Uke - Kizami Mawashi Geri - Nukite en Zenkutsu Dachi',
        stance: 'Kokutsu Dachi / Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 5,
        tripType: 'ida_y_vuelta',
        order: 6,
        embusen: 'Embusen Oficial',
        notes: 'Kokutsu Dachi. Chudan Shuto Uke - Kizami Mawashi Geri - Nukite en Zenkutsu Dachi (5 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-k7',
        group: 'kihon',
        name: 'Mae Geri Chudan - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 7,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Mae Geri Chudan - Gyaku zuki (3 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-k8',
        group: 'kihon',
        name: 'Mawashi Geri - Gyaku zuki',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 8,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Mawashi Geri - Gyaku zuki (3 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-k9',
        group: 'kihon',
        name: 'Ushiro Geri',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Giro',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 9,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Uchiro Geri (3 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-k10',
        group: 'kihon',
        name: 'Ura Mawashi Geri',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante (Mae)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 10,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Ura Mawashi Geri (3 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-k11',
        group: 'kihon',
        name: 'Yoko Geri Keague',
        stance: 'Kiba Dachi',
        direction: 'Lateral (Yoko)',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 11,
        embusen: 'Embusen Oficial',
        notes: 'Kiba Dachi. 3 veces, última Kiai, ida y vuelta.'
      },
      {
        id: 'tech-2-1-k12',
        group: 'kihon',
        name: 'Yoko Geri Kekomi',
        stance: 'Zenkutsu Dachi',
        direction: 'Adelante / Lateral',
        repetitions: 3,
        tripType: 'ida_y_vuelta',
        order: 12,
        embusen: 'Embusen Oficial',
        notes: 'Zenkutsu Dachi. Yoko Geri Kekomi (3 veces, última Kiai, ida y vuelta).'
      },
      {
        id: 'tech-2-1-ka1',
        group: 'kata',
        name: 'Jion y Hangetsu',
        stance: 'Zenkutsu / Kiba / Hangetsu Dachi',
        direction: 'Embusen Oficial',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 13,
        embusen: 'Embusen Oficial',
        notes: 'Jion y Hangetsu. (Incluye III Parte Examen Escrito).'
      },
      {
        id: 'tech-2-1-ku1',
        group: 'kumite',
        name: 'Jiyu Kumite (Kumite Libre)',
        stance: 'Kamae (Guardia libre)',
        direction: 'Libre',
        repetitions: 1,
        tripType: 'solo_ida',
        order: 14,
        embusen: 'Dojo Shiai-jo',
        notes: 'Kumite libre sin puntos (mayores de 45 años pueden hacer defensa personal).'
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
