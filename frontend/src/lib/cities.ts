/**
 * Bundled list of major Indian cities for the Add Lead "City" picker. Not exhaustive —
 * the SearchableSelect is used with `allowCustom` so any city not on this list can still
 * be typed in. Tamil Nadu / South India cities are front-loaded since the dealerships are
 * Chennai-based, but the list spans the country so out-of-state customers are covered too.
 */
export const INDIAN_CITIES: string[] = [
  // Tamil Nadu
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur",
  "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Chengalpattu", "Kanchipuram",
  "Cuddalore", "Nagercoil", "Karur", "Hosur", "Namakkal", "Sivakasi", "Pollachi", "Ambur",
  "Ariyalur", "Krishnagiri", "Pudukkottai", "Ramanathapuram", "Virudhunagar", "Villupuram",
  "Tiruvannamalai", "Nagapattinam", "Perambalur", "Dharmapuri", "Theni", "Tenkasi",
  // Neighbouring South
  "Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kochi", "Thiruvananthapuram",
  "Kozhikode", "Thrissur", "Kollam", "Kannur", "Hyderabad", "Secunderabad", "Warangal",
  "Vijayawada", "Visakhapatnam", "Guntur", "Nellore", "Tirupati", "Kurnool", "Rajahmundry",
  "Puducherry",
  // North / West / East metros & tier-1/2
  "Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Navi Mumbai", "Aurangabad", "Solapur",
  "Delhi", "New Delhi", "Gurugram", "Noida", "Ghaziabad", "Faridabad", "Kolkata", "Howrah",
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Jaipur", "Jodhpur", "Udaipur", "Kota",
  "Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Prayagraj", "Bhopal", "Indore",
  "Gwalior", "Jabalpur", "Patna", "Ranchi", "Jamshedpur", "Dhanbad", "Bhubaneswar", "Cuttack",
  "Guwahati", "Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Dehradun", "Raipur",
  "Bilaspur", "Srinagar", "Jammu", "Shimla", "Panaji", "Vasco da Gama",
];

export const CITY_OPTIONS = INDIAN_CITIES.map((c) => ({ value: c, label: c }));
