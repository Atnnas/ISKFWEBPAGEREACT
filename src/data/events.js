import kumaLogo from '../assets/images/kumaLogo.jpg';
import costaRicaFlag from '../assets/images/CostaRica.jpg';
import wkfLogo from '../assets/images/wkf.jpg';
import mexicoFlag from '../assets/images/mexico.jpg';
import icoderLogo from '../assets/images/icoder.jpg';
import iskfLogo from '../assets/images/iskf.jpg';
import kurobiLogo from '../assets/images/kurobiLogo.jpeg';
import iskfFondoRojo from '../assets/images/iskfFondoRojo.jpg';
import fecokaLogo from '../assets/images/FecokaLogo.jpg';
import ccondekaLogo from '../assets/images/LogoCcondeka.jpg';
import nicaraguaFlag from '../assets/images/nicaragua.jpg';
import wkfPanamericaLogo from '../assets/images/LogoWKFPanamerica.jpg';
import brazilFlag from '../assets/images/brazil.jpg';
import polandFlag from '../assets/images/poland.jpg';
import zanshinLogo from '../assets/images/zanshinLogo.jpg';

export const eventsData = [
    {
        id: 1,
        name: "Copa Kuma",
        date: "2026-05-04", // YYYY-MM-DD (Corrected for timezone)
        type: "Nacional",
        location: "Costa Rica",
        logo: kumaLogo,
        flag: costaRicaFlag,
        description: "Torneo Nacional de Karate Do Shotokan."
    },
    {
        id: 2,
        name: "Youth League",
        date: "2026-09-18",
        endDate: "2026-09-21",
        type: "Internacional",
        location: "Guadalajara, México",
        logo: wkfLogo,
        flag: mexicoFlag,
        description: "Evento internacional juvenil de alto nivel."
    },
    {
        id: 3,
        name: "Juegos Deportivos Nacionales",
        date: "2026-01-19",
        endDate: "2026-01-23",
        type: "Nacional",
        location: "Limón, Costa Rica",
        logo: icoderLogo,
        flag: costaRicaFlag,
        description: "La máxima fiesta deportiva de Costa Rica."
    },
    {
        id: 4,
        name: "Mundial ISKF",
        date: "2026-10-24",
        endDate: "2026-10-26",
        type: "Internacional",
        location: "Guadalajara, México",
        logo: iskfLogo,
        flag: mexicoFlag,
        description: "Campeonato Mundial de la International Shotokan Karate Federation."
    },
    {
        id: 5,
        name: "Copa Kurobi",
        date: "2026-06-28",
        endDate: "2026-06-29",
        type: "Nacional",
        location: "Costa Rica",
        logo: kurobiLogo,
        flag: costaRicaFlag,
        description: "Torneo de invitación abierto."
    },
    {
        id: 6,
        name: "Gasshuku",
        date: "2026-09-25",
        endDate: "2026-09-27",
        type: "Nacional",
        location: "Campamento La Cumbre, Costa Rica",
        logo: iskfFondoRojo,
        flag: costaRicaFlag,
        description: "Campamento de entrenamiento intensivo."
    },
    {
        id: 7,
        name: "Capacitación Nacional de Reglamentación WKF 2026",
        date: "2026-02-21T12:00:00",
        endDate: "2026-02-22T12:00:00",
        type: "Nacional",
        location: "Costa Rica",
        logo: fecokaLogo,
        flag: costaRicaFlag,
        description: "Seminario de actualización sobre el reglamento de competencia WKF."
    },
    {
        id: 8,
        name: "CCONDEKA",
        date: "2026-03-01T12:00:00",
        endDate: "2026-03-08T12:00:00",
        type: "Internacional",
        location: "Managua, Nicaragua",
        logo: ccondekaLogo,
        flag: nicaraguaFlag,
        description: "Campeonato Centroamericano de Karate CCONDEKA."
    },
    {
        id: 9,
        name: "Campeonato Clasificatorio JCC 2026",
        date: "2026-04-14T12:00:00",
        endDate: "2026-04-19T12:00:00",
        type: "Internacional",
        location: "Costa Rica",
        logo: fecokaLogo,
        flag: costaRicaFlag,
        description: "Campeonato Clasificatorio de karate para los Juegos Centroamericanos y del Caribe 2026."
    },
    {
        id: 10,
        name: "Serie CRC Ranking",
        date: "2026-04-25T12:00:00",
        endDate: "2026-04-26T12:00:00",
        type: "Nacional",
        location: "Costa Rica",
        logo: fecokaLogo,
        flag: costaRicaFlag,
        description: "Evento de ranking nacional - Serie CRC."
    },
    {
        id: 11,
        name: "Panamericano de Karate Senior y Sub 21",
        date: "2026-05-25T12:00:00",
        endDate: "2026-05-30T12:00:00",
        type: "Internacional",
        location: "Río de Janeiro, Brasil",
        logo: wkfPanamericaLogo,
        flag: brazilFlag,
        description: "Campeonato Panamericano de Karate para categorías Senior y Sub 21."
    },
    {
        id: 12,
        name: "Karate 1 Serie A Guadalajara",
        date: "2026-07-16T12:00:00",
        endDate: "2026-07-19T12:00:00",
        type: "Internacional",
        location: "Guadalajara, México",
        logo: wkfLogo,
        flag: mexicoFlag,
        description: "Evento de talla mundial de la WKF - Serie A."
    },
    {
        id: 13,
        name: "Juegos Centroamericanos y del Caribe 2026",
        date: "2026-08-08T12:00:00",
        type: "Internacional",
        location: "Sede por definir",
        logo: ccondekaLogo,
        flag: ccondekaLogo,
        description: "Posible fecha (por confirmar). Juegos Deportivos Centroamericanos y del Caribe."
    },
    {
        id: 14,
        name: "Panamericano U12, U14, Cadete & Junior",
        date: "2026-08-24T12:00:00",
        endDate: "2026-08-30T12:00:00",
        type: "Internacional",
        location: "Costa Rica",
        logo: wkfPanamericaLogo,
        flag: costaRicaFlag,
        description: "Campeonato Panamericano de Karate para categorías U12, U14, Cadete y Junior."
    },
    {
        id: 15,
        name: "Eliminatorias JDN 2026",
        date: "2026-09-05T12:00:00",
        endDate: "2026-09-06T12:00:00",
        type: "Nacional",
        location: "Costa Rica",
        logo: icoderLogo,
        flag: costaRicaFlag,
        description: "Eliminatorias para los Juegos Deportivos Nacionales 2026."
    },
    {
        id: 16,
        name: "Youth League Guadalajara",
        date: "2026-09-17T12:00:00",
        endDate: "2026-09-20T12:00:00",
        type: "Internacional",
        location: "Guadalajara, México",
        logo: wkfLogo,
        flag: mexicoFlag,
        description: "Evento internacional de la serie Youth League de la WKF."
    },
    {
        id: 17,
        name: "World Cadet, Junior & U21 Championship",
        date: "2026-10-14T12:00:00",
        endDate: "2026-10-18T12:00:00",
        type: "Internacional",
        location: "Bielsko-Biała, Polonia",
        logo: wkfLogo,
        flag: polandFlag,
        description: "Campeonato Mundial para categorías Cadete, Junior y Sub 21."
    },
    {
        id: 18,
        name: "Campeonato Nacional Costa Rica 2026",
        date: "2026-12-12T12:00:00",
        endDate: "2026-12-13T12:00:00",
        type: "Nacional",
        location: "Costa Rica",
        logo: fecokaLogo,
        flag: costaRicaFlag,
        description: "Cierre del calendario competitivo nacional."
    },
    {
        id: 19,
        name: "Copa Zanshin",
        date: "2026-10-04T12:00:00",
        type: "Nacional",
        location: "San José, Costa Rica",
        logo: zanshinLogo,
        flag: costaRicaFlag,
        description: "Torneo Copa Zanshin."
    }
];
