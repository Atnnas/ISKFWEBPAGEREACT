import corbata from '../assets/images/corbata-nuevo.jpg';
import dojoKun from '../assets/images/dojoKun.jpg';
import escudo from '../assets/images/escudo.jpg';
import jacket from '../assets/images/jacket-nueva.jpg';
import libroTecnica from '../assets/images/libroTecnica.jpg';
import tituloInternacional from '../assets/images/tituloInternacional.jpg';
import pasaporte from '../assets/images/pasaporte.jpg';
import membresiaInternacional from '../assets/images/membresiaInternacional.jpg';
import senseiRoyGatjens from '../assets/images/senseiRoyGatjens.jpg';
import titulosDan from '../assets/images/titulos-dan.jpg';
import procesosKyu from '../assets/images/Procesos-kyu.jpg';
import dojoKunSonido from '../assets/audio/dojoKunSonido.mp3';

export const aboutData = {
    identidad: {
        title: "Identidad ISKF-CR",
        subtitle: "Documentación & Símbolos",
        items: [
            {
                title: "Corbata Oficial",
                desc: "Distintivo oficial del Sensei.",
                img: corbata
            },
            {
                title: "Cuadro Dojo Kun",
                desc: "Principios rectores del Dojo.",
                img: dojoKun
            },
            {
                title: "Escudo Internacional",
                desc: "Shotokan Karate Federation.",
                img: escudo
            },
            {
                title: "Jacket I.S.K.F. - CR",
                desc: "Indumentaria oficial nacional.",
                img: jacket
            },
            {
                title: "Libro de Exámenes",
                desc: "Guía técnica para grados.",
                img: libroTecnica
            },
            {
                title: "Título Internacional",
                desc: "Certificación I.S.K.F. Global.",
                img: tituloInternacional
            },
            {
                title: "Pasaporte I.S.K.F.",
                desc: "Documento oficial de registro.",
                img: pasaporte
            },
            {
                title: "Membresía",
                desc: "Afiliación Internacional.",
                img: membresiaInternacional
            },
            {
                title: "Titulos de DAN",
                desc: "Certificaciones de grado cinturón negro.",
                img: titulosDan
            },
            {
                title: "Procesos de Kyu",
                desc: "Evaluaciones y seguimiento de grados Kyu.",
                img: procesosKyu
            }
        ]
    },
    estructura: {
        title: "Estructura Organizativa",
        subtitle: "Organización Oficial",
        shihan: {
            name: "Sensei Roy Gatjens",
            role: "Representante País",
            titles: ["Shihan", "Líder Técnico"],
            img: senseiRoyGatjens
        },
        gerencia: {
            title: "Gerencia General",
            department: "Dirección Ejecutiva",
            name: "Roy Lee Gatjens"
        },
        junta: [
            { role: "Presidente", name: "Roy Lee Gatjens Campos" },
            { role: "Vicepresidente", name: "Diego Alberto Loaiza Barboza" },
            { role: "Secretario", name: "Juan Andrés Achío Rojas" },
            { role: "Tesorera", name: "Celenia Campos Arce" },
            { role: "Vocal 1", name: "Celeste Jiménez" },
            { role: "Vocal 2", name: "Delia Calderón" },
            { role: "Fiscal", name: "Rosilia Rojas Guerrero" }
        ],
        comisiones: [
            { title: "C. Técnica", name: "Sensei Gatjens" },
            { title: "C. Competitiva", name: "Luis Román" },
            { title: "Atletas", name: "Fabricio Román" },
            { title: "Mujer & Deporte", name: "S. Campos" },
            { title: "Arbitraje", name: "María Méndez" },
            { title: "Ambiente", name: "Rosilia Rojas" }
        ]
    },
    pilares: [
        {
            title: "KIHON",
            subtitle: "Fundamentos",
            content: [
                "Kihon es el término que se refiere a una combinación de técnicas ejecutadas a manera de ejercicio. Esto sirve a los practicantes de karate para refinar sus técnicas y mejorar su velocidad y fuerza. Las combinaciones suelen ser hechas casi todas las clases y están constituidas en su mayoría por técnicas básicas, como Tsuki (puños), Uke (defensas) y Geri (patadas), aunque también se realizan combinaciones más avanzadas.",
                "La práctica del kihon es fundamental para cualquier karateka, así como un futbolista practica pases, tiros y dominio del balón en la búsqueda del perfeccionamiento, un karateka realiza kihon en búsqueda de pulir sus técnicas."
            ]
        },
        {
            title: "KATA",
            subtitle: "Forma",
            content: [
                "El kata es una forma de entrenamiento típica de las artes marciales asiáticas orientales y no tiene equivalente en las diferentes artes occidentales. En la isla de Okinawa y en China, la práctica del kata era el corazón real de los sistemas de combate. A través del kata, el conocimiento se transmitió de generación en generación y ellos todavía son el libro de texto del arte.",
                "El kata es el fundamento que nos enseña las posiciones del cuerpo, los movimientos, y los principios para usar manos y piernas. Nos enseña la respiración, la tranquilidad, la seguridad, el ritmo, el espíritu luchador y el poder de decisión.",
                "El kata es comparable a los juegos de go y shogui (ajedrez japonés), comienza y termina con un saludo. El kata no es una acumulación de técnicas básicas, sino que, constantemente está fluyendo al igual que la sangre circula y nos llena de vida."
            ],
            quote: "\"El kata es, junto con el kihon y el Kumite uno de los tres pilares del karate. Los tres son independientes pero inseparables y juntos forman al arte del karate do.\""
        },
        {
            title: "KUMITE",
            subtitle: "Combate",
            content: [
                "El término Kumite se compone de los caracteres kumi (el encuentro), y te (la mano). Después del kihon y el kata este es el tercer pilar del karate do. Kumite frecuentemente se traduce como lucha, pero debe entenderse como una \"técnica de encuentro\" o \"encuentro de manos\".",
                "No es una confrontación marcial para determinar el más fuerte ya que en la vida clásica del karate do no existe un oponente sino un compañero con el cual uno se relaciona con una recíproca e inextinguible dependencia.",
                "Sin un compañero el Kumite no podría existir. El significado real del Kumite es la gran oportunidad de comprender nuestro ego a través del entrenamiento con un compañero."
            ]
        }
    ],
    dojoKun: {
        title: "Dojo Kun",
        subtitle: "Filosofía Shotokan",
        intro: [
            "Dentro de la filosofía del Karate Shotokan, el Dojo Kun (o lema del dojo) es la guía básica de los valores morales que debe practicar y vivir un karateka en su día a día, ha sido transmitido desde tiempos antiguos y cumple la función de reforzar constantemente el comportamiento humanitario correcto dentro y fuera de la práctica del arte marcial.",
            "El Dojo Kun consiste en cinco reglas que se citan en voz alta al final de cada clase de Karate.",
            "El Karate Do Shotokan es una filosofía de vida que el maestro Gichin Funakoshi basó en el respeto, la lealtad y en la búsqueda de ser mejor cada día como persona. Éstos valores de vida se resumen en el Dojo Kun. A continuación, su enunciación original en japonés y su traducción al español, utilizada por la ISKF Costa Rica día tras día."
        ],
        audio: dojoKunSonido,
        rules: [
            { japanese: "HITOTSU JINKAKU KANSEI NI TSUTOMURU KOTO.", spanish: "Buscar un carácter perfecto" },
            { japanese: "HITOTSU MAKOTO NO MICHI O MAMORU KOTO.", spanish: "Ser leal" },
            { japanese: "HITOTSU DORYOUKU NO SEISHIN O YASHINAU KOTO.", spanish: "Esforzarse" },
            { japanese: "HITOTSU REIGI O OMONZURU KOTO.", spanish: "Respetar a los demás" },
            { japanese: "HITOTSU KEKKI NO YU O IMASHIMURU KOTO.", spanish: "Abstenerse de la violencia" }
        ],
        quote: {
            text: "\"El objetivo final del Karate no reside en la victoria o la derrota, sino en la perfección del carácter de sus participantes.\"",
            author: "Gichin Funakoshi"
        }
    },
    nijuKun: {
        title: "Niju Kun",
        subtitle: "Filosofía Shotokan",
        intro: [
            "Al igual que el Dojo Kun, el Niju Kun es un pilar de la filosofía del Karate. Consiste en 20 reglas o preceptos creados por el maestro Gichin Funakoshi para transmitir a través del tiempo sus ideales y su forma de vivir por medio del Karate Do.",
            "Lo anterior es también la visión que tuvo Gichin Funakoshi al escribir el Niju Kun, dejar a sus descendientes en el Karate una guía para alcanzar la perfección del arte marcial y de la integridad humana personal."
        ],
        quote: {
            text: "\"Cuando tomamos completa responsabilidad para transformarnos en personas de buen carácter e integridad, estaremos contribuyendo para hacer el mundo un lugar mejor y a su vez, a traer paz al mundo\"",
            author: "Maestro Teruyuki Okazaki"
        },
        rules: [
            "Karate comienza con cortesía y termina con cortesía",
            "No hay primera mano en el Karate",
            "El Karate apoya la justicia",
            "Primero compréndase a sí mismo, después a los demás",
            "El arte de la mente es más importante que el arte de la técnica",
            "La mente necesita ser liberada",
            "Los problemas nacen de la negligencia",
            "No piense que el Karate Do solo está en el Dojo",
            "El entrenamiento del Karate requiere toda una vida",
            "Transforme todo en Karate; ahí reside la exquisitez",
            "El Karate genuino es como el agua caliente; se enfría si no se mantiene con calor constante",
            "No tenga una idea de vencer, aun cuando la idea de no perder es necesaria",
            "Transfórmese según el oponente",
            "El resultado de la lucha depende de la maniobra",
            "Imagine que sus brazos y piernas son como espadas",
            "Cuando usted abandona el resguardo del hogar, hay un millón de enemigos mirándote",
            "Las posturas son para los principiantes, después vienen las posiciones naturales",
            "Haga el Kata correctamente, la lucha real es una cuestión diferente",
            "No se olvide del control dinámico (potencia), de la elasticidad y la velocidad",
            "Sea siempre bueno en la aplicación de todo lo que usted ha aprendido"
        ]
    }
};
