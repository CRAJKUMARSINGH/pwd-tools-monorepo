export type PwdLocation = {
  name: string;
  division: string;
  lat: number;
  lng: number;
  /** "verified" = cross-checked against a second source */
  confidence: "verified" | "approximate";
};

export const PWD_LOCATIONS: PwdLocation[] = [
  { name: "Udaipur (Girwa)",        division: "City Dn.",      lat: 24.585400, lng: 73.712500, confidence: "verified" },
  { name: "Badgaon",                division: "City Dn.",      lat: 24.620000, lng: 73.645000, confidence: "approximate" },
  { name: "Gogunda",                division: "Distt. Dn.-II", lat: 24.752200, lng: 73.527000, confidence: "verified" },
  { name: "Sayra",                  division: "Distt. Dn.-II", lat: 24.810000, lng: 73.510000, confidence: "approximate" },
  { name: "Jhadol",                 division: "Distt. Dn.-II", lat: 24.383300, lng: 73.416700, confidence: "approximate" },
  { name: "Kotra",                  division: "Distt. Dn.-II", lat: 24.450000, lng: 73.280000, confidence: "approximate" },
  { name: "Sarada",                 division: "Distt. Dn.-II", lat: 24.450000, lng: 73.600000, confidence: "approximate" },
  { name: "Rishabhdeo",             division: "Distt. Dn.-II", lat: 24.250000, lng: 73.466700, confidence: "approximate" },
  { name: "Lasadiya",               division: "Distt. Dn.-II", lat: 24.266700, lng: 73.700000, confidence: "approximate" },
  { name: "Kherwara",               division: "Dn.-Kherwara",  lat: 24.033300, lng: 73.600000, confidence: "verified" },
  { name: "Salumbar",               division: "Dn.-Slumber",   lat: 24.133300, lng: 74.050000, confidence: "verified" },
  { name: "Vallabhnagar",           division: "Dn.-Vallabhnagar", lat: 24.566700, lng: 73.950000, confidence: "verified" },
  { name: "Mavli",                  division: "Distt. Dn.-I",  lat: 24.783300, lng: 73.966700, confidence: "approximate" },
  { name: "Bhinder",                division: "Distt. Dn.-I",  lat: 24.500000, lng: 74.183300, confidence: "approximate" },
  { name: "Kanod",                  division: "Distt. Dn.-I",  lat: 24.633300, lng: 74.083300, confidence: "approximate" },
];

/** Used when a photo has no GPS and the officer does not pick anything. */
export const DEFAULT_LOCATION_NAME = "Udaipur (Girwa)";
