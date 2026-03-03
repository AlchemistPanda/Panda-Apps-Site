export type CityPrice = {
  city: string;
  aliases?: string[]; // alternate names / spellings
  petrol: number;
  diesel: number;
};

export type StateData = {
  state: string;
  slug: string;
  capital: string;
  cities: CityPrice[];
};

// Prices are approximate and sourced from public fuel-price portals.
// Last synced: March 2026. Prices in INR per litre (₹).
export const FUEL_DATA: StateData[] = [
  {
    state: "Kerala",
    slug: "kerala",
    capital: "Thiruvananthapuram",
    cities: [
      { city: "Ernakulam", aliases: ["Kochi", "Cochin", "Ernakulam/Kochi"], petrol: 104.06, diesel: 91.71 },
      { city: "Thiruvananthapuram", aliases: ["Trivandrum"], petrol: 104.12, diesel: 91.77 },
      { city: "Kozhikode", aliases: ["Calicut"], petrol: 104.04, diesel: 91.69 },
      { city: "Thrissur", aliases: ["Trichur"], petrol: 104.06, diesel: 91.71 },
      { city: "Kollam", aliases: ["Quilon"], petrol: 104.08, diesel: 91.73 },
      { city: "Palakkad", aliases: ["Palghat"], petrol: 104.02, diesel: 91.67 },
      { city: "Kannur", aliases: ["Cannanore"], petrol: 104.04, diesel: 91.69 },
      { city: "Malappuram", petrol: 104.03, diesel: 91.68 },
      { city: "Alappuzha", aliases: ["Alleppey"], petrol: 104.07, diesel: 91.72 },
      { city: "Kottayam", petrol: 104.05, diesel: 91.70 },
      { city: "Idukki", petrol: 104.10, diesel: 91.75 },
      { city: "Wayanad", petrol: 104.11, diesel: 91.76 },
      { city: "Kasaragod", petrol: 104.05, diesel: 91.70 },
      { city: "Pathanamthitta", petrol: 104.09, diesel: 91.74 },
    ],
  },
  {
    state: "Delhi",
    slug: "delhi",
    capital: "New Delhi",
    cities: [
      { city: "New Delhi", aliases: ["Delhi"], petrol: 94.72, diesel: 87.62 },
      { city: "Dwarka", petrol: 94.72, diesel: 87.62 },
      { city: "Rohini", petrol: 94.72, diesel: 87.62 },
      { city: "Noida (Delhi Border)", petrol: 94.83, diesel: 87.74 },
    ],
  },
  {
    state: "Maharashtra",
    slug: "maharashtra",
    capital: "Mumbai",
    cities: [
      { city: "Mumbai", petrol: 103.44, diesel: 89.97 },
      { city: "Pune", petrol: 103.57, diesel: 90.11 },
      { city: "Nagpur", petrol: 104.21, diesel: 90.58 },
      { city: "Nashik", petrol: 103.68, diesel: 90.22 },
      { city: "Aurangabad", aliases: ["Chhatrapati Sambhajinagar"], petrol: 103.74, diesel: 90.28 },
      { city: "Thane", petrol: 103.44, diesel: 89.97 },
      { city: "Solapur", petrol: 103.86, diesel: 90.40 },
      { city: "Kolhapur", petrol: 103.42, diesel: 89.95 },
    ],
  },
  {
    state: "Karnataka",
    slug: "karnataka",
    capital: "Bengaluru",
    cities: [
      { city: "Bengaluru", aliases: ["Bangalore"], petrol: 102.86, diesel: 88.94 },
      { city: "Mysuru", aliases: ["Mysore"], petrol: 102.80, diesel: 88.88 },
      { city: "Hubli", petrol: 102.76, diesel: 88.84 },
      { city: "Mangaluru", aliases: ["Mangalore"], petrol: 102.82, diesel: 88.90 },
      { city: "Belagavi", aliases: ["Belgaum"], petrol: 102.79, diesel: 88.87 },
      { city: "Kalaburagi", aliases: ["Gulbarga"], petrol: 102.84, diesel: 88.92 },
      { city: "Ballari", aliases: ["Bellary"], petrol: 102.82, diesel: 88.90 },
    ],
  },
  {
    state: "Tamil Nadu",
    slug: "tamil-nadu",
    capital: "Chennai",
    cities: [
      { city: "Chennai", petrol: 102.63, diesel: 94.24 },
      { city: "Coimbatore", petrol: 102.58, diesel: 94.19 },
      { city: "Madurai", petrol: 102.56, diesel: 94.17 },
      { city: "Tiruchirappalli", aliases: ["Trichy"], petrol: 102.57, diesel: 94.18 },
      { city: "Salem", petrol: 102.54, diesel: 94.15 },
      { city: "Tirunelveli", petrol: 102.52, diesel: 94.13 },
      { city: "Vellore", petrol: 102.60, diesel: 94.21 },
    ],
  },
  {
    state: "Telangana",
    slug: "telangana",
    capital: "Hyderabad",
    cities: [
      { city: "Hyderabad", petrol: 107.41, diesel: 95.65 },
      { city: "Warangal", petrol: 107.38, diesel: 95.62 },
      { city: "Nizamabad", petrol: 107.36, diesel: 95.60 },
      { city: "Karimnagar", petrol: 107.37, diesel: 95.61 },
      { city: "Khammam", petrol: 107.35, diesel: 95.59 },
    ],
  },
  {
    state: "Andhra Pradesh",
    slug: "andhra-pradesh",
    capital: "Amaravati",
    cities: [
      { city: "Visakhapatnam", aliases: ["Vizag"], petrol: 108.20, diesel: 95.94 },
      { city: "Vijayawada", petrol: 108.18, diesel: 95.92 },
      { city: "Guntur", petrol: 108.16, diesel: 95.90 },
      { city: "Tirupati", petrol: 108.22, diesel: 95.96 },
      { city: "Nellore", petrol: 108.15, diesel: 95.89 },
      { city: "Kurnool", petrol: 108.12, diesel: 95.86 },
    ],
  },
  {
    state: "West Bengal",
    slug: "west-bengal",
    capital: "Kolkata",
    cities: [
      { city: "Kolkata", aliases: ["Calcutta"], petrol: 103.94, diesel: 90.76 },
      { city: "Asansol", petrol: 103.88, diesel: 90.70 },
      { city: "Siliguri", petrol: 103.84, diesel: 90.66 },
      { city: "Durgapur", petrol: 103.86, diesel: 90.68 },
      { city: "Howrah", petrol: 103.92, diesel: 90.74 },
    ],
  },
  {
    state: "Rajasthan",
    slug: "rajasthan",
    capital: "Jaipur",
    cities: [
      { city: "Jaipur", petrol: 108.48, diesel: 93.72 },
      { city: "Jodhpur", petrol: 108.46, diesel: 93.70 },
      { city: "Udaipur", petrol: 108.44, diesel: 93.68 },
      { city: "Kota", petrol: 108.42, diesel: 93.66 },
      { city: "Bikaner", petrol: 108.40, diesel: 93.64 },
      { city: "Ajmer", petrol: 108.43, diesel: 93.67 },
    ],
  },
  {
    state: "Gujarat",
    slug: "gujarat",
    capital: "Gandhinagar",
    cities: [
      { city: "Ahmedabad", petrol: 96.63, diesel: 92.38 },
      { city: "Surat", petrol: 96.58, diesel: 92.33 },
      { city: "Vadodara", aliases: ["Baroda"], petrol: 96.60, diesel: 92.35 },
      { city: "Rajkot", petrol: 96.54, diesel: 92.29 },
      { city: "Bhavnagar", petrol: 96.52, diesel: 92.27 },
      { city: "Gandhinagar", petrol: 96.62, diesel: 92.37 },
    ],
  },
  {
    state: "Uttar Pradesh",
    slug: "uttar-pradesh",
    capital: "Lucknow",
    cities: [
      { city: "Lucknow", petrol: 96.57, diesel: 89.76 },
      { city: "Kanpur", petrol: 96.53, diesel: 89.72 },
      { city: "Agra", petrol: 96.49, diesel: 89.68 },
      { city: "Varanasi", aliases: ["Banaras", "Kashi"], petrol: 96.61, diesel: 89.80 },
      { city: "Noida", petrol: 96.64, diesel: 89.83 },
      { city: "Ghaziabad", petrol: 96.66, diesel: 89.85 },
      { city: "Allahabad", aliases: ["Prayagraj"], petrol: 96.58, diesel: 89.77 },
      { city: "Meerut", petrol: 96.50, diesel: 89.69 },
    ],
  },
  {
    state: "Madhya Pradesh",
    slug: "madhya-pradesh",
    capital: "Bhopal",
    cities: [
      { city: "Bhopal", petrol: 107.23, diesel: 92.80 },
      { city: "Indore", petrol: 107.19, diesel: 92.76 },
      { city: "Jabalpur", petrol: 107.16, diesel: 92.73 },
      { city: "Gwalior", petrol: 107.14, diesel: 92.71 },
      { city: "Ujjain", petrol: 107.17, diesel: 92.74 },
    ],
  },
  {
    state: "Punjab",
    slug: "punjab",
    capital: "Chandigarh",
    cities: [
      { city: "Ludhiana", petrol: 96.24, diesel: 84.68 },
      { city: "Amritsar", petrol: 96.22, diesel: 84.66 },
      { city: "Jalandhar", petrol: 96.20, diesel: 84.64 },
      { city: "Patiala", petrol: 96.18, diesel: 84.62 },
      { city: "Mohali", aliases: ["SAS Nagar"], petrol: 96.26, diesel: 84.70 },
    ],
  },
  {
    state: "Haryana",
    slug: "haryana",
    capital: "Chandigarh",
    cities: [
      { city: "Gurugram", aliases: ["Gurgaon"], petrol: 95.58, diesel: 88.82 },
      { city: "Faridabad", petrol: 95.54, diesel: 88.78 },
      { city: "Ambala", petrol: 95.50, diesel: 88.74 },
      { city: "Panipat", petrol: 95.47, diesel: 88.71 },
      { city: "Rohtak", petrol: 95.45, diesel: 88.69 },
      { city: "Hisar", petrol: 95.42, diesel: 88.66 },
    ],
  },
  {
    state: "Bihar",
    slug: "bihar",
    capital: "Patna",
    cities: [
      { city: "Patna", petrol: 102.22, diesel: 91.98 },
      { city: "Gaya", petrol: 102.18, diesel: 91.94 },
      { city: "Bhagalpur", petrol: 102.16, diesel: 91.92 },
      { city: "Muzaffarpur", petrol: 102.14, diesel: 91.90 },
    ],
  },
  {
    state: "Odisha",
    slug: "odisha",
    capital: "Bhubaneswar",
    cities: [
      { city: "Bhubaneswar", petrol: 103.19, diesel: 94.76 },
      { city: "Cuttack", petrol: 103.15, diesel: 94.72 },
      { city: "Rourkela", petrol: 103.12, diesel: 94.69 },
      { city: "Berhampur", petrol: 103.10, diesel: 94.67 },
    ],
  },
  {
    state: "Assam",
    slug: "assam",
    capital: "Dispur",
    cities: [
      { city: "Guwahati", petrol: 96.22, diesel: 83.96 },
      { city: "Dispur", petrol: 96.22, diesel: 83.96 },
      { city: "Dibrugarh", petrol: 96.19, diesel: 83.93 },
      { city: "Silchar", petrol: 96.16, diesel: 83.90 },
    ],
  },
  {
    state: "Jharkhand",
    slug: "jharkhand",
    capital: "Ranchi",
    cities: [
      { city: "Ranchi", petrol: 99.84, diesel: 95.34 },
      { city: "Jamshedpur", petrol: 99.80, diesel: 95.30 },
      { city: "Dhanbad", petrol: 99.76, diesel: 95.26 },
      { city: "Bokaro", petrol: 99.72, diesel: 95.22 },
    ],
  },
  {
    state: "Chhattisgarh",
    slug: "chhattisgarh",
    capital: "Raipur",
    cities: [
      { city: "Raipur", petrol: 97.68, diesel: 85.64 },
      { city: "Bhilai", petrol: 97.64, diesel: 85.60 },
      { city: "Bilaspur", petrol: 97.60, diesel: 85.56 },
      { city: "Raigarh", petrol: 97.56, diesel: 85.52 },
    ],
  },
  {
    state: "Uttarakhand",
    slug: "uttarakhand",
    capital: "Dehradun",
    cities: [
      { city: "Dehradun", petrol: 95.76, diesel: 89.47 },
      { city: "Haridwar", petrol: 95.72, diesel: 89.43 },
      { city: "Rishikesh", petrol: 95.74, diesel: 89.45 },
      { city: "Nainital", petrol: 95.78, diesel: 89.49 },
      { city: "Haldwani", petrol: 95.70, diesel: 89.41 },
    ],
  },
  {
    state: "Himachal Pradesh",
    slug: "himachal-pradesh",
    capital: "Shimla",
    cities: [
      { city: "Shimla", petrol: 97.14, diesel: 88.90 },
      { city: "Manali", petrol: 97.20, diesel: 88.96 },
      { city: "Dharamshala", petrol: 97.11, diesel: 88.87 },
      { city: "Solan", petrol: 97.08, diesel: 88.84 },
    ],
  },
  {
    state: "Jammu & Kashmir",
    slug: "jammu-kashmir",
    capital: "Srinagar",
    cities: [
      { city: "Srinagar", petrol: 95.90, diesel: 79.60 },
      { city: "Jammu", petrol: 95.82, diesel: 79.52 },
      { city: "Anantnag", petrol: 95.86, diesel: 79.56 },
      { city: "Baramulla", petrol: 95.88, diesel: 79.58 },
    ],
  },
  {
    state: "Goa",
    slug: "goa",
    capital: "Panaji",
    cities: [
      { city: "Panaji", aliases: ["Panjim"], petrol: 97.69, diesel: 85.98 },
      { city: "Margao", petrol: 97.65, diesel: 85.94 },
      { city: "Vasco da Gama", petrol: 97.67, diesel: 85.96 },
      { city: "Mapusa", petrol: 97.63, diesel: 85.92 },
    ],
  },
  {
    state: "Sikkim",
    slug: "sikkim",
    capital: "Gangtok",
    cities: [
      { city: "Gangtok", petrol: 101.46, diesel: 90.95 },
      { city: "Namchi", petrol: 101.42, diesel: 90.91 },
    ],
  },
  {
    state: "Tripura",
    slug: "tripura",
    capital: "Agartala",
    cities: [
      { city: "Agartala", petrol: 99.73, diesel: 90.92 },
    ],
  },
  {
    state: "Meghalaya",
    slug: "meghalaya",
    capital: "Shillong",
    cities: [
      { city: "Shillong", petrol: 94.42, diesel: 83.88 },
    ],
  },
  {
    state: "Manipur",
    slug: "manipur",
    capital: "Imphal",
    cities: [
      { city: "Imphal", petrol: 99.56, diesel: 85.49 },
    ],
  },
  {
    state: "Mizoram",
    slug: "mizoram",
    capital: "Aizawl",
    cities: [
      { city: "Aizawl", petrol: 101.30, diesel: 88.70 },
    ],
  },
  {
    state: "Nagaland",
    slug: "nagaland",
    capital: "Kohima",
    cities: [
      { city: "Kohima", petrol: 98.46, diesel: 86.78 },
      { city: "Dimapur", petrol: 98.40, diesel: 86.72 },
    ],
  },
  {
    state: "Arunachal Pradesh",
    slug: "arunachal-pradesh",
    capital: "Itanagar",
    cities: [
      { city: "Itanagar", petrol: 95.66, diesel: 82.10 },
    ],
  },
  {
    state: "Chandigarh (UT)",
    slug: "chandigarh",
    capital: "Chandigarh",
    cities: [
      { city: "Chandigarh", petrol: 94.24, diesel: 82.44 },
    ],
  },
  {
    state: "Puducherry",
    slug: "puducherry",
    capital: "Puducherry",
    cities: [
      { city: "Puducherry", aliases: ["Pondicherry"], petrol: 101.24, diesel: 92.46 },
      { city: "Karaikal", petrol: 101.20, diesel: 92.42 },
    ],
  },
  {
    state: "Andaman & Nicobar",
    slug: "andaman-nicobar",
    capital: "Port Blair",
    cities: [
      { city: "Port Blair", petrol: 84.10, diesel: 79.74 },
    ],
  },
  {
    state: "Lakshadweep",
    slug: "lakshadweep",
    capital: "Kavaratti",
    cities: [
      { city: "Kavaratti", petrol: 84.14, diesel: 79.78 },
    ],
  },
  {
    state: "Dadra & Nagar Haveli and Daman & Diu",
    slug: "dadra-daman-diu",
    capital: "Daman",
    cities: [
      { city: "Daman", petrol: 95.78, diesel: 88.44 },
      { city: "Silvassa", petrol: 95.76, diesel: 88.42 },
    ],
  },
  {
    state: "Ladakh (UT)",
    slug: "ladakh",
    capital: "Leh",
    cities: [
      { city: "Leh", petrol: 95.96, diesel: 79.66 },
      { city: "Kargil", petrol: 95.92, diesel: 79.62 },
    ],
  },
];

// Returns the StateData for a given state name (case-insensitive, partial match)
export function findState(name: string): StateData | undefined {
  const n = name.toLowerCase();
  return (
    FUEL_DATA.find((s) => s.state.toLowerCase() === n) ||
    FUEL_DATA.find((s) => s.state.toLowerCase().includes(n)) ||
    FUEL_DATA.find((s) => s.slug.replace(/-/g, " ").includes(n))
  );
}

// Returns best matching city within a state (checks aliases too)
export function findCity(state: StateData, name: string): CityPrice | undefined {
  const n = name.toLowerCase();
  return (
    state.cities.find(
      (c) =>
        c.city.toLowerCase() === n ||
        c.aliases?.some((a) => a.toLowerCase() === n)
    ) ||
    state.cities.find(
      (c) =>
        c.city.toLowerCase().includes(n) ||
        c.aliases?.some((a) => a.toLowerCase().includes(n))
    )
  );
}

export const DATA_DATE = "3 March 2026";
