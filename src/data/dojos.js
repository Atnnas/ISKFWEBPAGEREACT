import kamaeLogo from '../assets/images/kamaeLogo.jpeg';
import kumaLogo from '../assets/images/kumaLogo.jpg';
import kurobiLogo from '../assets/images/kurobiLogo.jpeg';
import soshinLogo from '../assets/images/soshinLogo.jpg';
import hikaruLogo from '../assets/images/hikaruLogo.jpeg';
import furinkazanLogo from '../assets/images/furinkazanLogo.jpg';
import chikaraLogo from '../assets/images/chikaraLogo.jpeg';
import kazanLogo from '../assets/images/logoKazan.jpg';
import keikanLogo from '../assets/images/keikanLogo.jpg';
import zanshinLogo from '../assets/images/zanshinLogo.jpg';
import tomariteLogo from '../assets/images/tomariteLogo.jpg';
import ToraLogo from '../assets/images/ToraLogo.jpg';
import fotoJuanAchio from '../assets/images/fotoSenseiJuanAchio.jpg';
import dohaiLogo from '../assets/images/dohaiLogo.jpeg';
import nintaiLogo from '../assets/images/nintaiLogo.jpg';
import fotoChristian from '../assets/images/fotoSenseiChristian.jpg';
import meiyoLogo from '../assets/images/meiyoLogo.jpg';
import bushidoKanLogo from '../assets/images/bushidoKanLogo.jpg';
import fotoSenseiLess from '../assets/images/fotoSenseiLess.jpg';

export const dojosData = [
    {
        id: "kamae",
        name: "Hombu Dojo Kamae",
        province: "Heredia",
        sensei: "Sensei Roy Gatjens",
        logo: kamaeLogo,
        detailsUrl: "#"
    },
    {
        id: "kuma",
        name: "Dojo Kuma",
        province: "Alajuela",
        sensei: "Sensei David Artavia",
        logo: kumaLogo,
        detailsUrl: "#"
    },
    {
        id: "kurobi",
        name: "Dojo Kuro Obi",
        province: "Alajuela",
        sensei: "Sensei Roy Lee Gatjens",
        profession: "Master en Gestión de Organizaciones Deportivas",
        logo: kurobiLogo,
        detailsUrl: "https://waze.com/ul/hd1u0gwsre",
        website: "https://www.kuroobicr.com/"
    },
    {
        id: "soshin",
        name: "Soshin Academy",
        province: "Heredia",
        sensei: "Sensei Juan Andrés Achío",
        rank: "3er Dan",
        profession: "Bach. Promotor de la Salud Física",
        logo: soshinLogo,
        senseiImage: fotoJuanAchio,
        detailsUrl: "https://maps.app.goo.gl/YHP5uDL3CLpafVhK6?g_st=ac"
    },
    {
        id: "hikaru",
        name: "Dojo Hikaru",
        province: "San José",
        sensei: "Sensei Josué Valverde Blanco",
        rank: "1er Dan",
        profession: "Hotelero",
        logo: hikaruLogo,
        detailsUrl: "#"
    },
    {
        id: "furinkazan",
        name: "Dojo Furinkazan",
        province: "San José",
        sensei: "Sensei Juan Barrantes",
        logo: furinkazanLogo,
        detailsUrl: "#"
    },
    {
        id: "chikara",
        name: "Dojo Chikara",
        province: "Puntarenas",
        sensei: "Sensei Neylin Berrocal",
        logo: chikaraLogo,
        detailsUrl: "#"
    },
    {
        id: "kazan",
        name: "Dojo Kazan",
        province: "Puntarenas",
        sensei: "Sensei Justin Rojas",
        rank: "1er Dan",
        profession: "Estudiante",
        logo: kazanLogo,
        detailsUrl: "https://maps.app.goo.gl/BisVQhFcCAQAAzHD7?g_st=ic"
    },
    {
        id: "keikan",
        name: "Dojo Keikan",
        province: "Heredia",
        sensei: "Sensei Josue Serrano Ramirez",
        rank: "1er Dan",
        profession: "Chef",
        logo: keikanLogo,
        detailsUrl: "https://maps.app.goo.gl/D22RiE6yY6Wfryow6"
    },
    {
        id: "zanshin",
        name: "Dojo ISKF Zanshin",
        province: "San José",
        sensei: "Sensei Christian Castillo Delgado",
        rank: "3er Dan",
        logo: zanshinLogo,
        senseiImage: fotoChristian,
        detailsUrl: "#",
        website: "https://www.zanshin-iskf.com"
    },
    {
        id: "tomarite",
        name: "Dojo Tomarite",
        province: "San José", // Coronado is in San José
        sensei: "Sensei Lesly Sequeira",
        profession: "Empresaria",
        logo: tomariteLogo,
        senseiImage: fotoSenseiLess,
        detailsUrl: "https://maps.app.goo.gl/Acbz8hVP6wvriKWGA"
    },
    {
        id: "tora",
        name: "Dojo Tora",
        province: "Alajuela",
        sensei: "Sensei Vernny Lopez",
        rank: "3er Dan",
        profession: "Test Engineer",
        logo: ToraLogo,
        detailsUrl: "https://waze.com/ul?a=share_drive&locale=es-419&sd=fkYLIj9O-8F-Xath1Q-sd&env=row&utm_source=waze_app&utm_campaign=share_drive"
    },
    {
        id: "dohai",
        name: "Dojo DOHAI",
        province: "Heredia",
        sensei: "Sensei Diego Loaiza",
        rank: "2do Dan",
        profession: "Ing. Electrónico",
        logo: dohaiLogo,
        detailsUrl: "#" // San Joaquín de Flores - Placeholder until specific link provided or generic search
    },
    {
        id: "nintai",
        name: "Dojo Nintai",
        province: "Heredia",
        sensei: "Sensei Diego Loaiza",
        rank: "2do Dan",
        profession: "Ing. Electrónico",
        logo: nintaiLogo,
        detailsUrl: "https://maps.app.goo.gl/M5HFeodwU5uakFK18?g_st=iw"
    },
    {
        id: "meiyo",
        name: "Dojo Meiyo",
        province: "San José",
        sensei: "Sensei Delia Calderon",
        rank: "1er Dan",
        profession: "Ingeniera en Sistemas",
        logo: meiyoLogo,
        detailsUrl: "#"
    },
    {
        id: "bushidokan",
        name: "Dojo Bushido Kan",
        province: "San José", // Confirmar provincia
        sensei: "Sensei Esteban Ruiz García",
        rank: "1er Dan",
        profession: "Psicólogo - Ciencias Policiales",
        logo: bushidoKanLogo,
        detailsUrl: "#"
    }
];
