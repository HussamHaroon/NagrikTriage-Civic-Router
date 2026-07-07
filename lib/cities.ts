// Real Indian city → real municipal department / helpline / portal data.
// Free, hardcoded, accurate as of public sources. Used to make the routed
// ticket actually actionable instead of just "Jal Board".

export type CityRecord = {
  id: string;
  name: string;
  state: string;
  // Default municipal email/portal for forwarding complaints.
  generalEmail: string;
  portal: string;
  // National emergency helplines (apply everywhere)
  emergency: { label: string; number: string; tel: string }[];
  // City-specific departments. AI picks the most relevant one.
  departments: { name: string; helpline?: string; email?: string }[];
  // Map center for the officer dashboard
  center: [number, number]; // [lat, lng]
};

// National defaults that are always useful, regardless of city. These power
// the emergency banner when no city is selected, and double as a safety net
// for any citizen who isn't in our 8-city curated list.
export const NATIONAL_HELPLINES: CityRecord["emergency"] = [
  { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
  { label: "Women Helpline", number: "181", tel: "tel:181" },
  { label: "Child Helpline", number: "1098", tel: "tel:1098" },
  { label: "Senior Citizen Helpline", number: "14567", tel: "tel:14567" },
  { label: "Cyber Crime", number: "1930", tel: "tel:1930" },
  { label: "NDMA Disaster Helpline", number: "1078", tel: "tel:1078" },
];

export const OTHER_CITY_ID = "other";

export const CITIES: CityRecord[] = [
  {
    id: "delhi",
    name: "Delhi",
    state: "NCT of Delhi",
    generalEmail: "complaints@mcdonline.nic.in",
    portal: "https://mcdonline.nic.in/webportal/onlinecomplaints.jsp",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "Delhi Jal Board", number: "1916", tel: "tel:1916" },
      { label: "BSES Rajdhani (Power)", number: "19123", tel: "tel:19123" },
    ],
    departments: [
      { name: "Delhi Jal Board (Water)", helpline: "1916", email: "djbcomplaint@nic.in" },
      { name: "Municipal Corporation of Delhi (MCD) — Sanitation", email: "complaints@mcdonline.nic.in" },
      { name: "Public Works Department (PWD)", helpline: "1800-11-3399" },
      { name: "BSES / Tata Power Delhi (Electricity)", helpline: "19123" },
      { name: "Delhi Pollution Control Committee", helpline: "011-23815226" },
      { name: "Delhi Fire Service", helpline: "101" },
    ],
    center: [28.6139, 77.209],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    generalEmail: "mcgm.help@mcgm.gov.in",
    portal: "https://www.mcgm.gov.in/irj/go/km/docs/documents/MCGM/Level2/CitizenServices.html",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "MCGM Helpline", number: "1916", tel: "tel:1916" },
      { label: "Adani Electricity", number: "19122", tel: "tel:19122" },
    ],
    departments: [
      { name: "BMC (Brihanmumbai Municipal Corporation)", helpline: "1916", email: "mcgm.help@mcgm.gov.in" },
      { name: "BEST Undertaking (Power)", helpline: "19122" },
      { name: "Maharashtra PWD", helpline: "1800-120-8040" },
      { name: "Mumbai Fire Brigade", helpline: "101" },
      { name: "Mumbai Police", helpline: "100" },
    ],
    center: [19.076, 72.8777],
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    generalEmail: "complaints@bbmp.gov.in",
    portal: "https://bbmp.gov.in/complaints",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "BWSSB (Water)", number: "1916", tel: "tel:1916" },
      { label: "BESCOM (Power)", number: "1912", tel: "tel:1912" },
    ],
    departments: [
      { name: "BBMP — Bruhat Bengaluru Mahanagara Palike", helpline: "080-22660000", email: "complaints@bbmp.gov.in" },
      { name: "BWSSB — Water Supply", helpline: "1916" },
      { name: "BESCOM — Electricity", helpline: "1912" },
      { name: "Karnataka PWD", helpline: "080-22252343" },
      { name: "Bengaluru Fire Service", helpline: "101" },
    ],
    center: [12.9716, 77.5946],
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    generalEmail: "commissioner@chennaicorporation.gov.in",
    portal: "https://chennaicorporation.gov.in/gcc/online-services/file-complaint/",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "Chennai Metro Water", number: "044-4567 4567", tel: "tel:04445674567" },
      { label: "TNEB (Power)", number: "94987 94987", tel: "tel:9498794987" },
    ],
    departments: [
      { name: "Greater Chennai Corporation", email: "commissioner@chennaicorporation.gov.in" },
      { name: "Chennai Metro Water Supply", helpline: "044-4567-4567" },
      { name: "TANGEDCO / TNEB (Electricity)", helpline: "94987-94987" },
      { name: "Tamil Nadu PWD", helpline: "044-25670173" },
      { name: "Chennai Fire Service", helpline: "101" },
    ],
    center: [13.0827, 80.2707],
  },
  {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    generalEmail: "commissioner@kmcgov.in",
    portal: "https://www.kmcgov.in/KMCPortal/jsp/KMCComplain.jsp",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "KMC Helpline", number: "1800-345-3323", tel: "tel:18003453323" },
      { label: "CESC (Power)", number: "1912", tel: "tel:1912" },
    ],
    departments: [
      { name: "Kolkata Municipal Corporation (KMC)", helpline: "1800-345-3323", email: "commissioner@kmcgov.in" },
      { name: "CESC Limited (Electricity)", helpline: "1912" },
      { name: "West Bengal PWD", helpline: "1800-345-3336" },
      { name: "Kolkata Police", helpline: "100" },
      { name: "Kolkata Fire Service", helpline: "101" },
    ],
    center: [22.5726, 88.3639],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    generalEmail: "commissioner@ghmc.gov.in",
    portal: "https://www.ghmc.gov.in/Complaints.html",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "GHMC Helpline", number: "040-2111 1111", tel: "tel:04021111111" },
      { label: "TSSPDCL (Power)", number: "1912", tel: "tel:1912" },
    ],
    departments: [
      { name: "GHMC — Greater Hyderabad Municipal Corporation", helpline: "040-21111111", email: "commissioner@ghmc.gov.in" },
      { name: "HMWS&SB (Water)", helpline: "155-313" },
      { name: "TSSPDCL (Electricity)", helpline: "1912" },
      { name: "Telangana PWD", helpline: "040-2337 1212" },
      { name: "Hyderabad Fire Service", helpline: "101" },
    ],
    center: [17.385, 78.4867],
  },
  {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    generalEmail: "commissioner@pmc.gov.in",
    portal: "https://www.pmc.gov.in/online-complaints",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "PMC Helpline", number: "1800-103-3030", tel: "tel:18001033030" },
      { label: "MSEDCL (Power)", number: "1912", tel: "tel:1912" },
    ],
    departments: [
      { name: "Pune Municipal Corporation (PMC)", helpline: "1800-103-3030", email: "commissioner@pmc.gov.in" },
      { name: "MSEDCL (Maharashtra Electricity)", helpline: "1912" },
      { name: "Maharashtra Jeevan Pradhikaran (Water)", helpline: "1800-233-1111" },
      { name: "Pune Fire Brigade", helpline: "101" },
    ],
    center: [18.5204, 73.8567],
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    generalEmail: "commissioner@ahmedabadcity.gov.in",
    portal: "https://ahmedabadcity.gov.in/",
    emergency: [
      { label: "Police / Fire / Ambulance", number: "112", tel: "tel:112" },
      { label: "AMC Helpline", number: "155-303", tel: "tel:155303" },
      { label: "DGVCL / Torrent Power", number: "19122", tel: "tel:19122" },
    ],
    departments: [
      { name: "Amdavad Municipal Corporation (AMC)", helpline: "155-303", email: "commissioner@ahmedabadcity.gov.in" },
      { name: "AMC Water Department", helpline: "079-2535-1811" },
      { name: "Torrent Power / DGVCL (Electricity)", helpline: "19122" },
      { name: "Gujarat PWD", helpline: "079-2325-1400" },
    ],
    center: [23.0225, 72.5714],
  },
  {
    id: OTHER_CITY_ID,
    name: "Other / Not listed",
    state: "India (national defaults)",
    generalEmail: "",
    portal: "https://pgportal.gov.in/",
    emergency: NATIONAL_HELPLINES,
    // No city-specific departments. The AI will pick the appropriate state or
    // national body (e.g. PWD, Jal Board, municipal corporation of their town)
    // and we surface national helplines in the emergency banner.
    departments: [],
    center: [22.5937, 78.9629], // geographic centre of India
  },
];

export const CITY_BY_ID: Record<string, CityRecord> = Object.fromEntries(
  CITIES.map((c) => [c.id, c])
);

// Best-effort department match against the AI's target_department string.
// Returns the city-specific record if found, otherwise the first matching dept.
export function findCityDepartment(
  city: CityRecord | undefined,
  targetDepartment: string
) {
  if (!city) return null;
  const t = targetDepartment.toLowerCase();
  // Keyword match against known department names.
  const keywords: [string, RegExp][] = [
    ["water", /(jal board|water|paani|drainage|sewage)/i],
    ["power", /(bescom|tneb|bses|cesc|electricity|power|bijli|torrent|dgvcl|msedcl|tsspdcl|adani)/i],
    ["sanitation", /(sanitation|garbage|kachra|kuda|safai|sewage|solid waste|swm)/i],
    ["pwd", /(pwd|road|pothole|bridge|public works)/i],
    ["fire", /(fire|blaze|smoke)/i],
    ["police", /(police|crime|theft)/i],
    ["health", /(health|hospital|mosquito|dengue|epidemic)/i],
  ];
  for (const [, re] of keywords) {
    if (re.test(t)) {
      const match = city.departments.find((d) => re.test(d.name));
      if (match) return match;
    }
  }
  // Fallback: return the general email/portal by returning the first dept as a
  // forwarding target. The AI's target_department is still shown to the user.
  return city.departments[0] ?? null;
}