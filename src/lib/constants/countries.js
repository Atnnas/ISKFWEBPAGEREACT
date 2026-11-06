/**
 * Catálogo Internacional Oficial de Países y Banderas para Eventos ISKF
 * Soporta banderas de alta resolución mediante FlagCDN e imágenes locales para compatibilidad.
 */

import costaRicaFlag from '../../assets/images/CostaRica.jpg';
import mexicoFlag from '../../assets/images/mexico.jpg';
import nicaraguaFlag from '../../assets/images/nicaragua.jpg';
import brazilFlag from '../../assets/images/brazil.jpg';
import polandFlag from '../../assets/images/poland.jpg';
import italiaFlag from '../../assets/images/italia.jpg';
import dominicanaFlag from '../../assets/images/dominicana.jpg';

export const LOCAL_FLAG_MAP = {
  costaRicaFlag,
  mexicoFlag,
  nicaraguaFlag,
  brazilFlag,
  polandFlag,
  italiaFlag,
  dominicanaFlag,
};

export const COUNTRIES = [
  {
    "code": "CR",
    "name": "Costa Rica",
    "flagName": "costaRicaFlag",
    "emoji": "🇨🇷",
    "isNational": true,
    "flagUrl": "https://flagcdn.com/w80/cr.png"
  },
  {
    "code": "US",
    "name": "Estados Unidos",
    "flagName": "us",
    "emoji": "🇺🇸",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/us.png"
  },
  {
    "code": "JP",
    "name": "Japón",
    "flagName": "jp",
    "emoji": "🇯🇵",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/jp.png"
  },
  {
    "code": "MX",
    "name": "México",
    "flagName": "mexicoFlag",
    "emoji": "🇲🇽",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mx.png"
  },
  {
    "code": "CA",
    "name": "Canadá",
    "flagName": "ca",
    "emoji": "🇨🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ca.png"
  },
  {
    "code": "PA",
    "name": "Panamá",
    "flagName": "pa",
    "emoji": "🇵🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pa.png"
  },
  {
    "code": "NI",
    "name": "Nicaragua",
    "flagName": "nicaraguaFlag",
    "emoji": "🇳🇮",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ni.png"
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "flagName": "gt",
    "emoji": "🇬🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/gt.png"
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "flagName": "sv",
    "emoji": "🇸🇻",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/sv.png"
  },
  {
    "code": "HN",
    "name": "Honduras",
    "flagName": "hn",
    "emoji": "🇭🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/hn.png"
  },
  {
    "code": "CO",
    "name": "Colombia",
    "flagName": "co",
    "emoji": "🇨🇴",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/co.png"
  },
  {
    "code": "BR",
    "name": "Brasil",
    "flagName": "brazilFlag",
    "emoji": "🇧🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/br.png"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "flagName": "ar",
    "emoji": "🇦🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ar.png"
  },
  {
    "code": "CL",
    "name": "Chile",
    "flagName": "cl",
    "emoji": "🇨🇱",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/cl.png"
  },
  {
    "code": "PE",
    "name": "Perú",
    "flagName": "pe",
    "emoji": "🇵🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pe.png"
  },
  {
    "code": "DO",
    "name": "República Dominicana",
    "flagName": "dominicanaFlag",
    "emoji": "🇩🇴",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/do.png"
  },
  {
    "code": "ES",
    "name": "España",
    "flagName": "es",
    "emoji": "🇪🇸",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/es.png"
  },
  {
    "code": "IT",
    "name": "Italia",
    "flagName": "italiaFlag",
    "emoji": "🇮🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/it.png"
  },
  {
    "code": "PL",
    "name": "Polonia",
    "flagName": "polandFlag",
    "emoji": "🇵🇱",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pl.png"
  },
  {
    "code": "DE",
    "name": "Alemania",
    "flagName": "de",
    "emoji": "🇩🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/de.png"
  },
  {
    "code": "FR",
    "name": "Francia",
    "flagName": "fr",
    "emoji": "🇫🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/fr.png"
  },
  {
    "code": "GB",
    "name": "Reino Unido",
    "flagName": "gb",
    "emoji": "🇬🇧",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/gb.png"
  },
  {
    "code": "ZA",
    "name": "Sudáfrica",
    "flagName": "za",
    "emoji": "🇿🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/za.png"
  },
  {
    "code": "AU",
    "name": "Australia",
    "flagName": "au",
    "emoji": "🇦🇺",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/au.png"
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "flagName": "uy",
    "emoji": "🇺🇾",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/uy.png"
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "flagName": "py",
    "emoji": "🇵🇾",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/py.png"
  },
  {
    "code": "BO",
    "name": "Bolivia",
    "flagName": "bo",
    "emoji": "🇧🇴",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bo.png"
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "flagName": "ec",
    "emoji": "🇪🇨",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ec.png"
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "flagName": "ve",
    "emoji": "🇻🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ve.png"
  },
  {
    "code": "CU",
    "name": "Cuba",
    "flagName": "cu",
    "emoji": "🇨🇺",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/cu.png"
  },
  {
    "code": "PR",
    "name": "Puerto Rico",
    "flagName": "pr",
    "emoji": "🇵🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pr.png"
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "flagName": "jm",
    "emoji": "🇯🇲",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/jm.png"
  },
  {
    "code": "TT",
    "name": "Trinidad y Tobago",
    "flagName": "tt",
    "emoji": "🇹🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/tt.png"
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "flagName": "bs",
    "emoji": "🇧🇸",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bs.png"
  },
  {
    "code": "BB",
    "name": "Barbados",
    "flagName": "bb",
    "emoji": "🇧🇧",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bb.png"
  },
  {
    "code": "BZ",
    "name": "Belice",
    "flagName": "bz",
    "emoji": "🇧🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bz.png"
  },
  {
    "code": "GY",
    "name": "Guyana",
    "flagName": "gy",
    "emoji": "🇬🇾",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/gy.png"
  },
  {
    "code": "SR",
    "name": "Surinam",
    "flagName": "sr",
    "emoji": "🇸🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/sr.png"
  },
  {
    "code": "HT",
    "name": "Haití",
    "flagName": "ht",
    "emoji": "🇭🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ht.png"
  },
  {
    "code": "AW",
    "name": "Aruba",
    "flagName": "aw",
    "emoji": "🇦🇼",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/aw.png"
  },
  {
    "code": "CW",
    "name": "Curazao",
    "flagName": "cw",
    "emoji": "🇨🇼",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/cw.png"
  },
  {
    "code": "AG",
    "name": "Antigua y Barbuda",
    "flagName": "ag",
    "emoji": "🇦🇬",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ag.png"
  },
  {
    "code": "DM",
    "name": "Dominica",
    "flagName": "dm",
    "emoji": "🇩🇲",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/dm.png"
  },
  {
    "code": "GD",
    "name": "Granada",
    "flagName": "gd",
    "emoji": "🇬🇩",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/gd.png"
  },
  {
    "code": "KN",
    "name": "San Cristóbal y Nieves",
    "flagName": "kn",
    "emoji": "🇰🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/kn.png"
  },
  {
    "code": "LC",
    "name": "Santa Lucía",
    "flagName": "lc",
    "emoji": "🇱🇨",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/lc.png"
  },
  {
    "code": "VC",
    "name": "San Vicente y las Granadinas",
    "flagName": "vc",
    "emoji": "🇻🇨",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/vc.png"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "flagName": "pt",
    "emoji": "🇵🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pt.png"
  },
  {
    "code": "CH",
    "name": "Suiza",
    "flagName": "ch",
    "emoji": "🇨🇭",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ch.png"
  },
  {
    "code": "AT",
    "name": "Austria",
    "flagName": "at",
    "emoji": "🇦🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/at.png"
  },
  {
    "code": "BE",
    "name": "Bélgica",
    "flagName": "be",
    "emoji": "🇧🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/be.png"
  },
  {
    "code": "NL",
    "name": "Países Bajos",
    "flagName": "nl",
    "emoji": "🇳🇱",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/nl.png"
  },
  {
    "code": "SE",
    "name": "Suecia",
    "flagName": "se",
    "emoji": "🇸🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/se.png"
  },
  {
    "code": "NO",
    "name": "Noruega",
    "flagName": "no",
    "emoji": "🇳🇴",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/no.png"
  },
  {
    "code": "DK",
    "name": "Dinamarca",
    "flagName": "dk",
    "emoji": "🇩🇰",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/dk.png"
  },
  {
    "code": "FI",
    "name": "Finlandia",
    "flagName": "fi",
    "emoji": "🇫🇮",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/fi.png"
  },
  {
    "code": "IE",
    "name": "Irlanda",
    "flagName": "ie",
    "emoji": "🇮🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ie.png"
  },
  {
    "code": "GR",
    "name": "Grecia",
    "flagName": "gr",
    "emoji": "🇬🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/gr.png"
  },
  {
    "code": "TR",
    "name": "Turquía",
    "flagName": "tr",
    "emoji": "🇹🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/tr.png"
  },
  {
    "code": "CZ",
    "name": "República Checa",
    "flagName": "cz",
    "emoji": "🇨🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/cz.png"
  },
  {
    "code": "HU",
    "name": "Hungría",
    "flagName": "hu",
    "emoji": "🇭🇺",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/hu.png"
  },
  {
    "code": "RO",
    "name": "Rumania",
    "flagName": "ro",
    "emoji": "🇷🇴",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ro.png"
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "flagName": "bg",
    "emoji": "🇧🇬",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bg.png"
  },
  {
    "code": "HR",
    "name": "Croacia",
    "flagName": "hr",
    "emoji": "🇭🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/hr.png"
  },
  {
    "code": "RS",
    "name": "Serbia",
    "flagName": "rs",
    "emoji": "🇷🇸",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/rs.png"
  },
  {
    "code": "SI",
    "name": "Eslovenia",
    "flagName": "si",
    "emoji": "🇸🇮",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/si.png"
  },
  {
    "code": "SK",
    "name": "Eslovaquia",
    "flagName": "sk",
    "emoji": "🇸🇰",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/sk.png"
  },
  {
    "code": "UA",
    "name": "Ucrania",
    "flagName": "ua",
    "emoji": "🇺🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ua.png"
  },
  {
    "code": "RU",
    "name": "Rusia",
    "flagName": "ru",
    "emoji": "🇷🇺",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ru.png"
  },
  {
    "code": "AL",
    "name": "Albania",
    "flagName": "al",
    "emoji": "🇦🇱",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/al.png"
  },
  {
    "code": "AD",
    "name": "Andorra",
    "flagName": "ad",
    "emoji": "🇦🇩",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ad.png"
  },
  {
    "code": "AM",
    "name": "Armenia",
    "flagName": "am",
    "emoji": "🇦🇲",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/am.png"
  },
  {
    "code": "AZ",
    "name": "Azerbaiyán",
    "flagName": "az",
    "emoji": "🇦🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/az.png"
  },
  {
    "code": "BA",
    "name": "Bosnia y Herzegovina",
    "flagName": "ba",
    "emoji": "🇧🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ba.png"
  },
  {
    "code": "CY",
    "name": "Chipre",
    "flagName": "cy",
    "emoji": "🇨🇾",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/cy.png"
  },
  {
    "code": "EE",
    "name": "Estonia",
    "flagName": "ee",
    "emoji": "🇪🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ee.png"
  },
  {
    "code": "GE",
    "name": "Georgia",
    "flagName": "ge",
    "emoji": "🇬🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ge.png"
  },
  {
    "code": "IS",
    "name": "Islandia",
    "flagName": "is",
    "emoji": "🇮🇸",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/is.png"
  },
  {
    "code": "LV",
    "name": "Letonia",
    "flagName": "lv",
    "emoji": "🇱🇻",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/lv.png"
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "flagName": "li",
    "emoji": "🇱🇮",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/li.png"
  },
  {
    "code": "LT",
    "name": "Lituania",
    "flagName": "lt",
    "emoji": "🇱🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/lt.png"
  },
  {
    "code": "LU",
    "name": "Luxemburgo",
    "flagName": "lu",
    "emoji": "🇱🇺",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/lu.png"
  },
  {
    "code": "MT",
    "name": "Malta",
    "flagName": "mt",
    "emoji": "🇲🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mt.png"
  },
  {
    "code": "MD",
    "name": "Moldavia",
    "flagName": "md",
    "emoji": "🇲🇩",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/md.png"
  },
  {
    "code": "MC",
    "name": "Mónaco",
    "flagName": "mc",
    "emoji": "🇲🇨",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mc.png"
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "flagName": "me",
    "emoji": "🇲🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/me.png"
  },
  {
    "code": "MK",
    "name": "Macedonia del Norte",
    "flagName": "mk",
    "emoji": "🇲🇰",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mk.png"
  },
  {
    "code": "SM",
    "name": "San Marino",
    "flagName": "sm",
    "emoji": "🇸🇲",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/sm.png"
  },
  {
    "code": "KR",
    "name": "Corea del Sur",
    "flagName": "kr",
    "emoji": "🇰🇷",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/kr.png"
  },
  {
    "code": "CN",
    "name": "China",
    "flagName": "cn",
    "emoji": "🇨🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/cn.png"
  },
  {
    "code": "TW",
    "name": "Taiwán",
    "flagName": "tw",
    "emoji": "🇹🇼",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/tw.png"
  },
  {
    "code": "HK",
    "name": "Hong Kong",
    "flagName": "hk",
    "emoji": "🇭🇰",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/hk.png"
  },
  {
    "code": "IN",
    "name": "India",
    "flagName": "in",
    "emoji": "🇮🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/in.png"
  },
  {
    "code": "ID",
    "name": "Indonesia",
    "flagName": "id",
    "emoji": "🇮🇩",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/id.png"
  },
  {
    "code": "MY",
    "name": "Malasia",
    "flagName": "my",
    "emoji": "🇲🇾",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/my.png"
  },
  {
    "code": "PH",
    "name": "Filipinas",
    "flagName": "ph",
    "emoji": "🇵🇭",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ph.png"
  },
  {
    "code": "SG",
    "name": "Singapur",
    "flagName": "sg",
    "emoji": "🇸🇬",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/sg.png"
  },
  {
    "code": "TH",
    "name": "Tailandia",
    "flagName": "th",
    "emoji": "🇹🇭",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/th.png"
  },
  {
    "code": "VN",
    "name": "Vietnam",
    "flagName": "vn",
    "emoji": "🇻🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/vn.png"
  },
  {
    "code": "IL",
    "name": "Israel",
    "flagName": "il",
    "emoji": "🇮🇱",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/il.png"
  },
  {
    "code": "AE",
    "name": "Emiratos Árabes Unidos",
    "flagName": "ae",
    "emoji": "🇦🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ae.png"
  },
  {
    "code": "SA",
    "name": "Arabia Saudita",
    "flagName": "sa",
    "emoji": "🇸🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/sa.png"
  },
  {
    "code": "QA",
    "name": "Catar",
    "flagName": "qa",
    "emoji": "🇶🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/qa.png"
  },
  {
    "code": "BH",
    "name": "Baréin",
    "flagName": "bh",
    "emoji": "🇧🇭",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bh.png"
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "flagName": "kw",
    "emoji": "🇰🇼",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/kw.png"
  },
  {
    "code": "OM",
    "name": "Omán",
    "flagName": "om",
    "emoji": "🇴🇲",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/om.png"
  },
  {
    "code": "JO",
    "name": "Jordania",
    "flagName": "jo",
    "emoji": "🇯🇴",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/jo.png"
  },
  {
    "code": "LB",
    "name": "Líbano",
    "flagName": "lb",
    "emoji": "🇱🇧",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/lb.png"
  },
  {
    "code": "KZ",
    "name": "Kazajistán",
    "flagName": "kz",
    "emoji": "🇰🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/kz.png"
  },
  {
    "code": "UZ",
    "name": "Uzbekistán",
    "flagName": "uz",
    "emoji": "🇺🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/uz.png"
  },
  {
    "code": "PK",
    "name": "Pakistán",
    "flagName": "pk",
    "emoji": "🇵🇰",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pk.png"
  },
  {
    "code": "BD",
    "name": "Bangladés",
    "flagName": "bd",
    "emoji": "🇧🇩",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bd.png"
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "flagName": "lk",
    "emoji": "🇱🇰",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/lk.png"
  },
  {
    "code": "NP",
    "name": "Nepal",
    "flagName": "np",
    "emoji": "🇳🇵",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/np.png"
  },
  {
    "code": "MN",
    "name": "Mongolia",
    "flagName": "mn",
    "emoji": "🇲🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mn.png"
  },
  {
    "code": "KH",
    "name": "Camboya",
    "flagName": "kh",
    "emoji": "🇰🇭",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/kh.png"
  },
  {
    "code": "LA",
    "name": "Laos",
    "flagName": "la",
    "emoji": "🇱🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/la.png"
  },
  {
    "code": "MM",
    "name": "Myanmar",
    "flagName": "mm",
    "emoji": "🇲🇲",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mm.png"
  },
  {
    "code": "EG",
    "name": "Egipto",
    "flagName": "eg",
    "emoji": "🇪🇬",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/eg.png"
  },
  {
    "code": "MA",
    "name": "Marruecos",
    "flagName": "ma",
    "emoji": "🇲🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ma.png"
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "flagName": "ng",
    "emoji": "🇳🇬",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ng.png"
  },
  {
    "code": "KE",
    "name": "Kenia",
    "flagName": "ke",
    "emoji": "🇰🇪",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ke.png"
  },
  {
    "code": "DZ",
    "name": "Argelia",
    "flagName": "dz",
    "emoji": "🇩🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/dz.png"
  },
  {
    "code": "TN",
    "name": "Túnez",
    "flagName": "tn",
    "emoji": "🇹🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/tn.png"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "flagName": "sn",
    "emoji": "🇸🇳",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/sn.png"
  },
  {
    "code": "GH",
    "name": "Ghana",
    "flagName": "gh",
    "emoji": "🇬🇭",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/gh.png"
  },
  {
    "code": "CI",
    "name": "Costa de Marfil",
    "flagName": "ci",
    "emoji": "🇨🇮",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ci.png"
  },
  {
    "code": "CM",
    "name": "Camerún",
    "flagName": "cm",
    "emoji": "🇨🇲",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/cm.png"
  },
  {
    "code": "ET",
    "name": "Etiopía",
    "flagName": "et",
    "emoji": "🇪🇹",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/et.png"
  },
  {
    "code": "TZ",
    "name": "Tanzania",
    "flagName": "tz",
    "emoji": "🇹🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/tz.png"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "flagName": "ug",
    "emoji": "🇺🇬",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ug.png"
  },
  {
    "code": "AO",
    "name": "Angola",
    "flagName": "ao",
    "emoji": "🇦🇴",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ao.png"
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "flagName": "mz",
    "emoji": "🇲🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mz.png"
  },
  {
    "code": "ZW",
    "name": "Zimbabue",
    "flagName": "zw",
    "emoji": "🇿🇼",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/zw.png"
  },
  {
    "code": "BW",
    "name": "Botsuana",
    "flagName": "bw",
    "emoji": "🇧🇼",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/bw.png"
  },
  {
    "code": "NA",
    "name": "Namibia",
    "flagName": "na",
    "emoji": "🇳🇦",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/na.png"
  },
  {
    "code": "MU",
    "name": "Mauricio",
    "flagName": "mu",
    "emoji": "🇲🇺",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/mu.png"
  },
  {
    "code": "NZ",
    "name": "Nueva Zelanda",
    "flagName": "nz",
    "emoji": "🇳🇿",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/nz.png"
  },
  {
    "code": "FJ",
    "name": "Fiyi",
    "flagName": "fj",
    "emoji": "🇫🇯",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/fj.png"
  },
  {
    "code": "PG",
    "name": "Papúa Nueva Guinea",
    "flagName": "pg",
    "emoji": "🇵🇬",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pg.png"
  },
  {
    "code": "NC",
    "name": "Nueva Caledonia",
    "flagName": "nc",
    "emoji": "🇳🇨",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/nc.png"
  },
  {
    "code": "PF",
    "name": "Polinesia Francesa",
    "flagName": "pf",
    "emoji": "🇵🇫",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/pf.png"
  },
  {
    "code": "GU",
    "name": "Guam",
    "flagName": "gu",
    "emoji": "🇬🇺",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/gu.png"
  },
  {
    "code": "WS",
    "name": "Samoa",
    "flagName": "ws",
    "emoji": "🇼🇸",
    "isNational": false,
    "flagUrl": "https://flagcdn.com/w80/ws.png"
  }
];

/**
 * Obtener la URL o asset de bandera para cualquier flagName, código ISO o URL
 */
export function getEventFlagUrl(flagName) {
  if (!flagName) return costaRicaFlag;

  // 1. Coincidencia con imágenes locales históricas
  if (LOCAL_FLAG_MAP[flagName]) {
    return LOCAL_FLAG_MAP[flagName];
  }

  // 2. Si ya es una URL absoluta o relativa
  if (typeof flagName === 'string' && (flagName.startsWith('http://') || flagName.startsWith('https://') || flagName.startsWith('/'))) {
    return flagName;
  }

  // 3. Buscar en el catálogo oficial de países
  const clean = String(flagName).trim().toLowerCase();
  const match = COUNTRIES.find(c => 
    c.flagName.toLowerCase() === clean || 
    c.code.toLowerCase() === clean ||
    c.name.toLowerCase() === clean
  );

  if (match) {
    if (LOCAL_FLAG_MAP[match.flagName]) {
      return LOCAL_FLAG_MAP[match.flagName];
    }
    return match.flagUrl;
  }

  // 4. Si tiene 2 caracteres, asumir código ISO-2
  if (clean.length === 2) {
    return `https://flagcdn.com/w80/${clean}.png`;
  }

  return costaRicaFlag;
}

export function findCountryByFlagName(flagName) {
  if (!flagName) return COUNTRIES[0];
  const clean = String(flagName).trim().toLowerCase();
  return COUNTRIES.find(c => 
    c.flagName.toLowerCase() === clean || 
    c.code.toLowerCase() === clean ||
    c.name.toLowerCase() === clean
  ) || COUNTRIES[0];
}
